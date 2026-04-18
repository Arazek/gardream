import { Component, inject, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import {
  TopAppBarComponent, NavAction,
  PlotTypeSelectorComponent, PlotTypeOption,
  DayPickerComponent,
  FormFieldComponent,
} from '../../shared';
import { NotificationService, AppNotification } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import { PlotsActions } from './store/plots.actions';
import { PlotType } from './store/plots.state';

const PLOT_TYPE_OPTIONS: PlotTypeOption[] = [
  { value: 'ground_bed',    label: 'Ground Bed',    icon: 'yard' },
  { value: 'raised_bed',    label: 'Raised Bed',    icon: 'crop_square' },
  { value: 'container',     label: 'Container',     icon: 'local_florist' },
  { value: 'vertical',      label: 'Vertical',      icon: 'view_week' },
  { value: 'seedling_tray', label: 'Seedling Tray', icon: 'grass' },
];

@Component({
  selector: 'app-plot-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    TopAppBarComponent,
    PlotTypeSelectorComponent,
    DayPickerComponent,
    FormFieldComponent,
    NotificationCentreComponent,
  ],
  styleUrl: './plot-new.page.scss',
  template: `
    <app-top-app-bar title="New Plot" [actions]="topBarActions()" (actionClick)="onTopBarAction($event)">
      <button leading class="icon-btn" aria-label="Cancel" (click)="cancel()">
        <span class="material-symbols-outlined">close</span>
      </button>
    </app-top-app-bar>

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notificationService.notifications()"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <ion-content class="plot-new-content">
      <form [formGroup]="form" (ngSubmit)="submit()" class="plot-new-form">

        <!-- Name -->
        <section class="plot-new-section">
          <h2 class="plot-new-section__title">Plot name</h2>
          <app-form-field
            label="Name"
            placeholder="e.g. Front raised bed"
            [control]="nameControl"
          />
        </section>

        <!-- Type -->
        <section class="plot-new-section">
          <h2 class="plot-new-section__title">Plot type</h2>
          <app-plot-type-selector
            [options]="plotTypeOptions"
            [selected]="form.value.plot_type"
            (selectedChange)="form.patchValue({ plot_type: $event })"
          />
        </section>

        <!-- Dimensions -->
        <section class="plot-new-section">
          <h2 class="plot-new-section__title">Dimensions</h2>
          <p class="plot-new-section__hint">Number of rows and columns in your grid.</p>
          <div class="plot-new-dims">
            <app-form-field
              label="Rows"
              type="number"
              placeholder="4"
              [control]="rowsControl"
            />
            <span class="plot-new-dims__x">×</span>
            <app-form-field
              label="Columns"
              type="number"
              placeholder="4"
              [control]="colsControl"
            />
          </div>
          <!-- Live preview -->
          <div class="plot-new-preview" [style.--prev-cols]="form.value.cols || 4">
            @for (cell of previewCells; track $index) {
              <div class="plot-new-preview__cell"></div>
            }
          </div>
        </section>

        <!-- Watering days -->
        <section class="plot-new-section">
          <h2 class="plot-new-section__title">Watering days</h2>
          <p class="plot-new-section__hint">Which days of the week do you water this plot?</p>
          <app-day-picker
            [selected]="form.value.watering_days"
            (selectedChange)="form.patchValue({ watering_days: $event })"
          />
        </section>

        <!-- Fertilisation days -->
        <section class="plot-new-section">
          <h2 class="plot-new-section__title">Fertilisation days</h2>
          <p class="plot-new-section__hint">Which days of the week do you fertilise this plot?</p>
          <app-day-picker
            [selected]="form.value.fertilise_days"
            (selectedChange)="form.patchValue({ fertilise_days: $event })"
          />
        </section>

        <!-- Submit -->
        <button
          type="submit"
          class="plot-new-submit"
          [disabled]="form.invalid || submitting"
        >
          @if (submitting) {
            <span class="material-symbols-outlined plot-new-submit__spin">progress_activity</span>
          } @else {
            Create plot
          }
        </button>

        @if (error) {
          <p class="plot-new-error">{{ error }}</p>
        }

      </form>
    </ion-content>
  `,
})
export class PlotNewPage {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;

  readonly topBarActions = computed<NavAction[]>(() => [
    { id: 'notifications', icon: 'notifications', label: 'Notifications',
      badge: this.notificationService.unreadCount() },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ]);

  constructor() {
  }

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    } else if (id === 'profile') {
      this.goToSettings();
    }
  }

  readonly plotTypeOptions = PLOT_TYPE_OPTIONS;

  form: FormGroup = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(2)]],
    plot_type:       ['raised_bed', Validators.required],
    rows:            [4, [Validators.required, Validators.min(1), Validators.max(20)]],
    cols:            [4, [Validators.required, Validators.min(1), Validators.max(20)]],
    watering_days:   [[]],
    fertilise_days:  [[]],
  });

  get nameControl() { return this.form.get('name') as any; }
  get rowsControl() { return this.form.get('rows') as any; }
  get colsControl() { return this.form.get('cols') as any; }

  submitting = false;
  error = '';

  get previewCells(): null[] {
    const r = Math.min(Math.max(Number(this.form.value.rows) || 1, 1), 20);
    const c = Math.min(Math.max(Number(this.form.value.cols) || 1, 1), 20);
    return Array(r * c).fill(null);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.error = '';
    const v = this.form.value;
    this.store.dispatch(PlotsActions.createPlot({
      payload: {
        name: v.name.trim(),
        plot_type: v.plot_type as PlotType,
        rows: Number(v.rows),
        cols: Number(v.cols),
        watering_days: v.watering_days ?? [],
        fertilise_days: v.fertilise_days ?? [],
      },
    }));
    // Navigate to plots list — effect will redirect after success
    this.router.navigate(['/tabs/plots']);
  }

  cancel(): void {
    this.router.navigate(['/tabs/plots']);
  }

  goToSettings(): void {
    this.router.navigate(['/tabs/settings']);
  }
}
