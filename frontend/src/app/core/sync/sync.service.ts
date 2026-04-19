import { Injectable, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { App } from '@capacitor/app';

import { LocalDbService, OutboxEntry } from '../db/local-db.service';
import { NetworkService } from './network.service';
import {
  _syncOnline,
  _syncPendingCount,
  _syncIsSyncing,
  _syncHasError,
} from './sync-status.signal';
import { PlotsApiService } from '../api/plots-api.service';
import { TasksApiService } from '../api/tasks-api.service';
import { CropsApiService } from '../api/crops-api.service';
import { PlotsActions } from '../../features/plots/store/plots.actions';
import { TasksActions } from '../../features/tasks/store/tasks.actions';
import { CropsActions } from '../../features/crops/store/crops.actions';
import { LocalNotificationsService } from '../notifications/local-notifications.service';

@Injectable({ providedIn: 'root' })
export class SyncService implements OnDestroy {
  private readonly db = inject(LocalDbService);
  private readonly network = inject(NetworkService);
  private readonly store = inject(Store);
  private readonly plotsApi = inject(PlotsApiService);
  private readonly tasksApi = inject(TasksApiService);
  private readonly cropsApi = inject(CropsApiService);
  private readonly notifications = inject(LocalNotificationsService);

  private subs = new Subscription();

  start(): void {
    // Track network changes
    this.subs.add(
      this.network.online$.subscribe(async (online) => {
        _syncOnline.set(online);
        if (online) await this.sync();
        await this.updatePendingCount();
      })
    );

    // Poll every 5 minutes while online
    this.subs.add(
      interval(5 * 60 * 1000).pipe(
        filter(() => this.network.isOnline)
      ).subscribe(() => this.sync())
    );

    // Sync on app foreground
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.network.isOnline) this.sync();
    });
  }

  // ── Push: drain outbox ──────────────────────────────────────────────────

  async push(): Promise<void> {
    const pending = await this.db.getPendingOutbox();
    for (const entry of pending) {
      try {
        await this.pushEntry(entry);
        await this.db.markOutboxSynced(entry.id!);
      } catch (err: any) {
        const status = err?.status ?? 0;
        if (status === 409) {
          await this.db.markOutboxFailed(entry.id!, err?.error?.detail ?? 'Conflict');
          _syncHasError.set(true);
        } else {
          // Network error — stop and retry later
          break;
        }
      }
    }
    await this.updatePendingCount();
  }

  private async pushEntry(entry: OutboxEntry): Promise<void> {
    const payload = JSON.parse(entry.payload);
    switch (entry.entity_type) {
      case 'plot':
        if (entry.operation === 'create') {
          const plot = await this.plotsApi.create(payload).toPromise();
          if (plot && entry.entity_id.startsWith('tmp_')) {
            await this.db.rewriteTmpId(entry.entity_id, plot.id, 'plot');
          }
        } else if (entry.operation === 'update') {
          await this.plotsApi.update(entry.entity_id, payload).toPromise();
        } else if (entry.operation === 'delete') {
          await this.plotsApi.delete(entry.entity_id).toPromise();
        }
        break;
      case 'plot_slot':
        if (entry.operation === 'create') {
          const slot = await this.plotsApi.createSlot(payload.plotId, payload).toPromise();
          if (slot && entry.entity_id.startsWith('tmp_')) {
            await this.db.rewriteTmpId(entry.entity_id, slot.id, 'plot_slot');
          }
        } else if (entry.operation === 'update') {
          await this.plotsApi.updateSlot(payload.plotId, entry.entity_id, payload).toPromise();
        } else if (entry.operation === 'delete') {
          await this.plotsApi.deleteSlot(payload.plotId, entry.entity_id).toPromise();
        } else if (entry.operation === 'transplant') {
          const newSlot = await this.plotsApi.transplantSlot(
            payload.plotId, entry.entity_id,
            { target_plot_id: payload.targetPlotId, target_row: payload.targetRow, target_col: payload.targetCol }
          ).toPromise();
          if (newSlot && payload.newSlotId?.startsWith('tmp_')) {
            await this.db.rewriteTmpId(payload.newSlotId, newSlot.id, 'plot_slot');
          }
        }
        break;
      case 'task':
        if (entry.operation === 'update') {
          await this.tasksApi.update(entry.entity_id, payload).toPromise();
        } else if (entry.operation === 'delete') {
          await this.tasksApi.delete(entry.entity_id).toPromise();
        }
        break;
    }
  }

  // ── Pull: overwrite local with server state ─────────────────────────────

  async pull(): Promise<void> {
    // Plots
    const plots = await this.plotsApi.getAll().toPromise() ?? [];
    await this.db.upsertPlots(plots);
    this.store.dispatch(PlotsActions.loadPlotsSuccess({ plots }));

    // Slots for each plot
    for (const plot of plots) {
      const slots = await this.plotsApi.getSlots(plot.id).toPromise() ?? [];
      await this.db.upsertSlots(slots);
      // Also upsert any crops embedded in slots (ensures new crops are cached)
      const cropsInSlots = slots.filter(s => s.crop).map(s => s.crop!);
      if (cropsInSlots.length > 0) {
        await this.db.upsertCrops(cropsInSlots);
      }
      this.store.dispatch(PlotsActions.loadSlotsSuccess({ plotId: plot.id, slots }));
    }

    // Tasks for today
    const today = new Date().toISOString().slice(0, 10);
    const tasks = await this.tasksApi.getAll({ due_date: today }).toPromise() ?? [];
    await this.db.upsertTasks(tasks);
    this.store.dispatch(TasksActions.loadTasksSuccess({ tasks }));

    // Always pull crops to capture any new ones added server-side
    const crops = await this.cropsApi.getAll().toPromise() ?? [];
    await this.db.upsertCrops(crops);
    await this.db.setSyncMeta('crops_version', '1');
    this.store.dispatch(CropsActions.loadCropsSuccess({ crops }));

    await this.db.setSyncMeta('last_pull_at', Date.now().toString());
    await this.rescheduleNotifications();
  }

  async sync(): Promise<void> {
    if (_syncIsSyncing()) return;
    _syncIsSyncing.set(true);
    try {
      await this.push();
      await this.pull();
      _syncHasError.set((await this.db.getFailedOutbox()).length > 0);
    } catch {
      // Network error — will retry on next trigger
    } finally {
      _syncIsSyncing.set(false);
      await this.updatePendingCount();
    }
  }

  // ── Initial pull on login ───────────────────────────────────────────────

  async initialPull(): Promise<void> {
    // Force crops pull on first login (ignore cache)
    await this.db.setSyncMeta('crops_version', '');
    await this.pull();
  }

  // ── Helpers for banner ──────────────────────────────────────────────────

  async getFailedEntries(): Promise<OutboxEntry[]> {
    return this.db.getFailedOutbox();
  }

  async discardFailedEntry(id: number): Promise<void> {
    await this.db.deleteOutboxEntry(id);
    await this.updatePendingCount();
    _syncHasError.set((await this.db.getFailedOutbox()).length > 0);
  }

  async retryFailedEntry(id: number): Promise<void> {
    await this.db.run(`UPDATE outbox SET status = 'pending' WHERE id = ?`, [id]);
    await this.sync();
  }

  private async updatePendingCount(): Promise<void> {
    const count = await this.db.getPendingCount();
    _syncPendingCount.set(count);
  }

  private async rescheduleNotifications(): Promise<void> {
    const plots = await this.db.getAllPlots();
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const endDate = thirtyDaysOut.toISOString().slice(0, 10);

    // Collect all tasks in the 30-day window
    const allTasks: import('../../features/tasks/store/tasks.state').Task[] = [];
    for (let d = today; d <= endDate; d = addOneDay(d)) {
      const dayTasks = await this.db.getTasksByDate(d);
      allTasks.push(...dayTasks);
    }

    // Build slot labels
    const slotLabels: Record<string, string> = {};
    for (const plot of plots) {
      const slots = await this.db.getSlotsByPlot(plot.id);
      for (const slot of slots) {
        const crop = await this.db.getCropById(slot.crop_id);
        if (crop) slotLabels[slot.id] = `${crop.name} in ${plot.name}`;
      }
    }

    await this.notifications.scheduleTaskNotifications(allTasks, slotLabels);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    App.removeAllListeners();
  }
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
