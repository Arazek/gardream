import { Component, OnInit, inject, effect, Injector, runInInjectionContext, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { TopAppBarComponent, NavAction, PageContentComponent, PageBodyWrapperComponent } from '../../shared';
import { NotificationService, AppNotification } from '../../core/notifications/notification.service';
import { SyncService } from '../../core/sync/sync.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import { LocalDbService } from '../../core/db/local-db.service';
import { SpecimensActions } from './store/specimens.actions';
import { selectSpecimenBySlotId, selectSpecimensLoading, selectSpecimensError } from './store/specimens.selectors';
import { selectSelectedPlot, selectSelectedPlotSlots } from './store/plots.selectors';
import { Specimen, NoteEntry, SYSTEM_STAGES } from './store/specimens.state';
import { Milestone } from './store/specimens.state';
import { PlotsActions } from './store/plots.actions';
import { PlotSlot } from './store/plots.state';
import { SpecimenPhotoLogComponent } from './specimen-photo-log.component';
import { SpecimenMilestonesComponent } from './specimen-milestones.component';
import { ScheduleSectionComponent } from '../../shared/components/schedule-section/schedule-section.component';

@Component({
  selector: 'app-specimen-detail',
  standalone: true,
  imports: [
    CommonModule,
    TopAppBarComponent,
    PageContentComponent,
    PageBodyWrapperComponent,
    SpecimenPhotoLogComponent,
    SpecimenMilestonesComponent,
    NotificationCentreComponent,
    ScheduleSectionComponent,
  ],
  styleUrl: './specimen-detail.page.scss',
  template: `
    <app-top-app-bar [title]="title()" [actions]="topBarActions()" (actionClick)="onTopBarAction($event)">
      <button leading class="icon-btn" aria-label="Back" (click)="goBack()">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
    </app-top-app-bar>

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notificationService.notifications()"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <app-page-content class="specimen-detail-content">
      <app-page-body-wrapper>
        @if (specimen(); as specimen) {
          <div class="specimen-container">

            <!-- Progress Section -->
            <div class="progress-section">
              <div class="progress-header">
                <h2>{{ specimen.current_stage }}</h2>
                <span class="progress-label">{{ specimen.progress_pct }}%</span>
              </div>
              <progress class="progress-bar" [value]="specimen.progress_pct" max="100"></progress>
            </div>

            <!-- Sow Date Section -->
            <div class="sow-section">
              <h3>Sown on</h3>
              <input
                type="date"
                class="sow-input"
                [value]="slot()?.sow_date ?? ''"
                (change)="onSowDateChange($event)"
                aria-label="Sow date"
              />
            </div>

            <!-- Stage Picker Section -->
            <div class="stage-section">
              <h3>Stage</h3>
              <div class="stage-chips">
                @for (stage of SYSTEM_STAGES; track stage) {
                  <button
                    class="stage-chip"
                    [class.stage-chip--active]="stage === (specimen.stage_override ?? specimen.current_stage)"
                    (click)="setStage(specimen, stage)"
                  >{{ stage }}</button>
                }
              </div>
              @if (specimen.stage_override) {
                <button class="stage-clear-btn" (click)="clearStageOverride(specimen)">
                  Clear override
                </button>
              }
            </div>

            <!-- Watering Schedule Section -->
            <div class="schedule-section">
              <app-schedule-section
                label="WATERING"
                toggleLabel="Use plot default"
                [defaultDays]="plotWateringDays()"
                [days]="wateringDays()"
                [intervalWeeks]="wateringInterval()"
                (scheduleChange)="onWateringScheduleChange($event)"
              />
            </div>

            <!-- Fertilisation Schedule Section -->
            <div class="schedule-section">
              <app-schedule-section
                label="FERTILISATION"
                toggleLabel="Use plot default"
                [defaultDays]="plotFertiliseDays()"
                [days]="fertiliseDays()"
                [intervalWeeks]="fertiliseInterval()"
                (scheduleChange)="onFertiliseScheduleChange($event)"
              />
            </div>

            <!-- Notes Section -->
            <div class="notes-section">
              <h3>Notes</h3>
              <div class="note-list">
                @for (entry of specimen.note_entries; track $index) {
                  <div class="note-entry">
                    <span class="note-entry__date">{{ formatDate(entry.date) }}</span>
                    <p class="note-entry__text">{{ entry.text }}</p>
                  </div>
                }
                @if (specimen.note_entries.length === 0) {
                  <p class="note-empty">No notes yet.</p>
                }
              </div>

              @if (addingNote) {
                <div class="add-note-form">
                  <input
                    type="date"
                    class="add-note-form__date"
                    [value]="noteDate"
                    (change)="noteDate = $any($event.target).value"
                    aria-label="Note date"
                  />
                  <textarea
                    class="add-note-form__text"
                    [value]="noteText"
                    (input)="noteText = $any($event.target).value"
                    placeholder="Write a note..."
                    rows="3"
                  ></textarea>
                  <div class="add-note-form__actions">
                    <button class="btn btn--secondary" (click)="cancelNote()">Cancel</button>
                    <button class="btn btn--primary" [disabled]="!noteText.trim()" (click)="submitNote(specimen)">Add</button>
                  </div>
                </div>
              } @else {
                <button class="add-note-btn" (click)="addingNote = true">
                  <span class="material-symbols-outlined">add</span>
                  Add note
                </button>
              }
            </div>

            <!-- Photo Log Section -->
            <div class="photo-section">
              <h3>Photos</h3>
              <app-specimen-photo-log
                [photos]="specimen.photo_log"
                (photoAdded)="onPhotoAdded(specimen, $event)"
              />
            </div>

            <!-- Milestones Section -->
            <div class="milestones-section">
              <app-specimen-milestones
                [milestones]="specimen.milestones"
                [currentStage]="specimen.current_stage"
                [sowDate]="slot()?.sow_date ?? ''"
                [cropDaysToGermination]="slot()?.crop?.days_to_germination ?? 0"
                [cropDaysToHarvest]="slot()?.crop?.days_to_harvest ?? 0"
                (milestoneAdded)="onMilestoneAdded(specimen, $event)"
                (milestoneReached)="onMilestoneReached(specimen, $event)"
              />
            </div>

          </div>
        } @else {
          @if (loading()) {
            <div class="loading">Loading specimen...</div>
          } @else {
            <div class="error">{{ error() }}</div>
          }
        }
      </app-page-body-wrapper>
    </app-page-content>
  `,
})
export class SpecimenDetailPage implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;

  readonly topBarActions = computed<NavAction[]>(() => [
    { id: 'notifications', icon: 'notifications', label: 'Notifications',
      badge: this.notificationService.unreadCount() },
  ]);

  readonly SYSTEM_STAGES = SYSTEM_STAGES;

  addingNote = false;
  noteText = '';
  noteDate = new Date().toISOString().slice(0, 10);

  // Signals
  readonly plot = toSignal(this.store.select(selectSelectedPlot), { initialValue: null });
  readonly slots = toSignal(this.store.select(selectSelectedPlotSlots), { initialValue: [] });
  readonly specimen = toSignal(this.store.select(selectSpecimenBySlotId(this.route.snapshot.paramMap.get('slotId') ?? '')), { initialValue: undefined });
  readonly loading = toSignal(this.store.select(selectSpecimensLoading), { initialValue: true });
  readonly error = toSignal(this.store.select(selectSpecimensError), { initialValue: null });

  // Computed properties
  readonly title = computed(() => {
    const plot = this.plot();
    const slots = this.slots();
    const slotId = this.route.snapshot.paramMap.get('slotId');
    const slot = slots.find(s => s.id === slotId);
    if (!plot || !slot) return 'Specimen';
    const coords = slot.row != null ? `${slot.row + 1},${(slot.col ?? 0) + 1}` : 'photo';
    const cropName = slot.crop?.name ?? '';
    return `${plot.name} (${coords}) - ${cropName}`;
  });

  readonly slot = computed(() => {
    const slots = this.slots();
    const slotId = this.route.snapshot.paramMap.get('slotId');
    return slots.find(s => s.id === slotId) ?? null;
  });

  readonly wateringDays = computed(() => this.slot()?.watering_days_override ?? null);
  readonly wateringInterval = computed(() => this.slot()?.watering_interval_weeks ?? 1);
  readonly fertiliseDays = computed(() => this.slot()?.fertilise_days_override ?? null);
  readonly fertiliseInterval = computed(() => this.slot()?.fertilise_interval_weeks ?? 1);
  readonly plotWateringDays = computed(() => this.plot()?.watering_days ?? []);
  readonly plotFertiliseDays = computed(() => this.plot()?.fertilise_days ?? []);

  constructor() {
  }

  ngOnInit(): void {
    const plotId = this.route.snapshot.paramMap.get('id') ?? '';
    const slotId = this.route.snapshot.paramMap.get('slotId') ?? '';

    if (!plotId || !slotId) return;

    // If slot ID starts with tmp_, redirect after sync
    if (slotId.startsWith('tmp_')) {
      this.handleTempSlot(plotId, slotId);
      return;
    }

    this.loadSpecimenData(plotId, slotId);
  }

  private async handleTempSlot(plotId: string, tmpSlotId: string): Promise<void> {
    const db = inject(LocalDbService);
    const sync = inject(SyncService);

    await sync.sync();

    const slots = await db.getSlotsByPlot(plotId);
    const slot = slots.find(s => s.id.endsWith(tmpSlotId.replace('tmp_', '')));

    if (slot) {
      this.router.navigate(['/tabs/plots', plotId, 'slots', slot.id, 'specimen'], {
        replaceUrl: true,
      });
    } else {
      console.error('[SpecimenDetail] Slot not found after sync, loading anyway');
      this.loadSpecimenData(plotId, tmpSlotId);
    }
  }

  private loadSpecimenData(plotId: string, slotId: string): void {
    this.store.dispatch(SpecimensActions.loadSpecimen({ plotId, slotId }));
    this.store.dispatch(PlotsActions.loadPlots());
    this.store.dispatch(PlotsActions.selectPlot({ id: plotId }));
    this.store.dispatch(PlotsActions.loadSlots({ plotId }));
  }

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    }
  }

  onSowDateChange(event: Event): void {
    const plotId = this.route.snapshot.paramMap.get('id')!;
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    const sow_date = (event.target as HTMLInputElement).value;
    this.store.dispatch(PlotsActions.updateSlot({ plotId, slotId, payload: { sow_date } }));
  }

  setStage(specimen: Specimen, stage: string): void {
    if (stage === specimen.stage_override) return;
    const plotId = this.route.snapshot.paramMap.get('id')!;
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    this.store.dispatch(SpecimensActions.updateSpecimen({
      plotId, slotId, payload: { stage_override: stage },
    }));
  }

  clearStageOverride(specimen: Specimen): void {
    const plotId = this.route.snapshot.paramMap.get('id')!;
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    this.store.dispatch(SpecimensActions.updateSpecimen({
      plotId, slotId, payload: { stage_override: null },
    }));
  }

  submitNote(specimen: Specimen): void {
    if (!this.noteText.trim()) return;
    const plotId = this.route.snapshot.paramMap.get('id')!;
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    const entry: NoteEntry = { text: this.noteText.trim(), date: this.noteDate };
    this.store.dispatch(SpecimensActions.updateSpecimen({
      plotId, slotId,
      payload: { note_entries: [entry, ...specimen.note_entries] },
    }));
    this.addingNote = false;
    this.noteText = '';
    this.noteDate = new Date().toISOString().slice(0, 10);
  }

  cancelNote(): void {
    this.addingNote = false;
    this.noteText = '';
  }

  formatDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  onPhotoAdded(specimen: Specimen, file: File): void {
    const plotId = this.route.snapshot.paramMap.get('id')!;
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    const today = new Date().toISOString().slice(0, 10);
    this.store.dispatch(SpecimensActions.uploadPhoto({ plotId, slotId, file, takenAt: today }));
  }

  onMilestoneAdded(specimen: Specimen, milestone: Milestone): void {
    const plotId = this.route.snapshot.paramMap.get('id')!;
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    const milestones = [...specimen.milestones, milestone];
    this.store.dispatch(SpecimensActions.updateSpecimen({ plotId, slotId, payload: { milestones } }));
  }

  onMilestoneReached(specimen: Specimen, reached: Milestone): void {
    const plotId = this.route.snapshot.paramMap.get('id')!;
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    const milestones = specimen.milestones.some(m => m.stage_name === reached.stage_name)
      ? specimen.milestones.map(m => m.stage_name === reached.stage_name ? reached : m)
      : [...specimen.milestones, reached];
    this.store.dispatch(SpecimensActions.updateSpecimen({ plotId, slotId, payload: { milestones } }));
  }

  onWateringScheduleChange(value: { days: number[] | null; intervalWeeks: number }): void {
    const slot = this.slot();
    const plot = this.plot();
    if (!slot || !plot) return;
    this.store.dispatch(PlotsActions.updateSlotSchedule({
      plotId: plot.id,
      slotId: slot.id,
      watering_days_override: value.days,
      watering_interval_weeks: value.intervalWeeks,
      fertilise_days_override: slot.fertilise_days_override,
      fertilise_interval_weeks: slot.fertilise_interval_weeks,
    }));
  }

  onFertiliseScheduleChange(value: { days: number[] | null; intervalWeeks: number }): void {
    const slot = this.slot();
    const plot = this.plot();
    if (!slot || !plot) return;
    this.store.dispatch(PlotsActions.updateSlotSchedule({
      plotId: plot.id,
      slotId: slot.id,
      watering_days_override: slot.watering_days_override,
      watering_interval_weeks: slot.watering_interval_weeks,
      fertilise_days_override: value.days,
      fertilise_interval_weeks: value.intervalWeeks,
    }));
  }

  goBack(): void {
    this.router.navigate(['/tabs/plots', this.route.snapshot.paramMap.get('id')]);
  }
}
