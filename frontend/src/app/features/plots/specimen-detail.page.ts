import { Component, OnInit, inject, effect } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable } from 'rxjs';

import { TopAppBarComponent, NavAction, PageContentComponent, PageBodyWrapperComponent } from '../../shared';
import { NotificationService } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import { SpecimensActions } from './store/specimens.actions';
import { selectSpecimenBySlotId, selectSpecimensLoading, selectSpecimensError } from './store/specimens.selectors';
import { selectSelectedPlot, selectSelectedPlotSlots } from './store/plots.selectors';
import { Specimen, NoteEntry, SYSTEM_STAGES } from './store/specimens.state';
import { Milestone } from './store/specimens.state';
import { PlotsActions } from './store/plots.actions';
import { PlotSlot } from './store/plots.state';
import { SpecimenPhotoLogComponent } from './specimen-photo-log.component';
import { SpecimenMilestonesComponent } from './specimen-milestones.component';

@Component({
  selector: 'app-specimen-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    TopAppBarComponent,
    PageContentComponent,
    PageBodyWrapperComponent,
    SpecimenPhotoLogComponent,
    SpecimenMilestonesComponent,
    NotificationCentreComponent,
  ],
  styleUrl: './specimen-detail.page.scss',
  template: `
    <app-top-app-bar [title]="(title$ | async) ?? 'Specimen'" [actions]="topBarActions" (actionClick)="onTopBarAction($event)">
      <button leading class="icon-btn" aria-label="Back" (click)="goBack()">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
    </app-top-app-bar>

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notifications"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <app-page-content class="specimen-detail-content">
      <app-page-body-wrapper>
        @if (specimen$ | async; as specimen) {
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
                [value]="(slot$ | async)?.sow_date ?? ''"
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
                [sowDate]="(slot$ | async)?.sow_date ?? ''"
                [cropDaysToGermination]="(slot$ | async)?.crop?.days_to_germination ?? 0"
                [cropDaysToHarvest]="(slot$ | async)?.crop?.days_to_harvest ?? 0"
                (milestoneAdded)="onMilestoneAdded(specimen, $event)"
                (milestoneReached)="onMilestoneReached(specimen, $event)"
              />
            </div>

          </div>
        } @else {
          @if (loading$ | async) {
            <div class="loading">Loading specimen...</div>
          } @else {
            <div class="error">{{ error$ | async }}</div>
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
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;
  notifications: any[] = [];

  readonly topBarActions: NavAction[] = [
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
  ];

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    }
  }

  readonly SYSTEM_STAGES = SYSTEM_STAGES;

  addingNote = false;
  noteText = '';
  noteDate = new Date().toISOString().slice(0, 10);

  specimen$: Observable<Specimen | undefined> = new Observable();
  loading$ = this.store.select(selectSpecimensLoading);
  error$ = this.store.select(selectSpecimensError);

  readonly title$ = combineLatest([
    this.store.select(selectSelectedPlot),
    this.store.select(selectSelectedPlotSlots),
  ]).pipe(
    map(([plot, slots]) => {
      const slotId = this.route.snapshot.paramMap.get('slotId');
      const slot = slots.find(s => s.id === slotId);
      if (!plot || !slot) return 'Specimen';
      const coords = `${slot.row + 1},${slot.col + 1}`;
      const cropName = slot.crop?.name ?? '';
      return `${plot.name} (${coords}) - ${cropName}`;
    }),
  );

  readonly slot$ = this.store.select(selectSelectedPlotSlots).pipe(
    map(slots => {
      const slotId = this.route.snapshot.paramMap.get('slotId');
      return slots.find(s => s.id === slotId) ?? null;
    }),
  );

  ngOnInit(): void {
    const plotId = this.route.snapshot.paramMap.get('id');
    const slotId = this.route.snapshot.paramMap.get('slotId');
    if (plotId && slotId) {
      this.specimen$ = this.store.select(selectSpecimenBySlotId(slotId));
      this.store.dispatch(SpecimensActions.loadSpecimen({ plotId, slotId }));
      // Ensure plot + slots are in store for title and sow date (needed on direct reload)
      this.store.dispatch(PlotsActions.loadPlots());
      this.store.dispatch(PlotsActions.selectPlot({ id: plotId }));
      this.store.dispatch(PlotsActions.loadSlots({ plotId }));
    }

    // Notifications - use effect to reactively update
    effect(() => {
      this.notifications = this.notificationService.notifications();
      this.updateTopBarBadge();
    });
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

  private updateTopBarBadge(): void {
    const notifAction = this.topBarActions.find(a => a.id === 'notifications');
    if (notifAction) {
      notifAction.badge = this.notificationService.unreadCount();
    }
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

  goBack(): void {
    this.router.navigate(['/tabs/plots', this.route.snapshot.paramMap.get('id')]);
  }
}
