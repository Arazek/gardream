import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import Keycloak from 'keycloak-js';
import { Store } from '@ngrx/store';

import { ThemeService } from './core/theme/theme.service';
import { LocalDbService } from './core/db/local-db.service';
import { SyncService } from './core/sync/sync.service';
import { LocalNotificationsService } from './core/notifications/local-notifications.service';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';
import { TasksActions } from './features/tasks/store/tasks.actions';
import { PlotsActions } from './features/plots/store/plots.actions';
import { TaskGeneratorService } from './core/task-generator/task-generator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, OfflineBannerComponent],
  template: `
    <ion-app>
      <app-offline-banner />
      <ion-router-outlet />
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  private db = inject(LocalDbService);
  private syncService = inject(SyncService);
  private notifications = inject(LocalNotificationsService);
  private keycloak = inject(Keycloak);
  private store = inject(Store);
  private taskGen = inject(TaskGeneratorService);

  constructor() {
    inject(ThemeService);
  }

  async ngOnInit(): Promise<void> {
    // Init local SQLite database
    await this.db.init();

    // Start sync service (registers network + foreground listeners)
    this.syncService.start();

    // If authenticated, do initial pull to seed local DB from server
    if (this.keycloak.authenticated) {
      await this.syncService.initialPull();
    }

    // Regenerate tasks if the table is empty (e.g. first run after local-first migration)
    await this.regenerateTasksIfNeeded();

    // Pre-load plots + slots into store synchronously so notification selectors
    // have full data before pending tasks trigger the water notification effect
    await this.preloadPlotsAndSlots();

    // Load all pending tasks — notification effects will now have slot/crop data
    this.store.dispatch(TasksActions.loadAllPendingTasks());

    // Request notification permission (no-op if already granted/denied)
    await this.notifications.requestPermission();
  }

  private async preloadPlotsAndSlots(): Promise<void> {
    const plots = await this.db.getAllPlots();
    this.store.dispatch(PlotsActions.loadPlotsSuccess({ plots }));
    for (const plot of plots) {
      const slots = await this.db.getSlotsByPlot(plot.id);
      this.store.dispatch(PlotsActions.loadSlotsSuccess({ plotId: plot.id, slots }));
    }
  }

  private async regenerateTasksIfNeeded(): Promise<void> {
    if (await this.db.hasAnyTasks()) return;

    const plots = await this.db.getAllPlots();
    for (const plot of plots) {
      const slots = await this.db.getSlotsByPlot(plot.id);
      for (const slot of slots) {
        const crop = await this.db.getCropById(slot.crop_id);
        if (crop) {
          const tasks = this.taskGen.generate(slot, plot, crop, '');
          await this.db.insertTasksBulk(tasks);
        }
      }
    }
  }
}
