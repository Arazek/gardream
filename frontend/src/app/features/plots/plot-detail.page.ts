import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, AlertController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { TopAppBarComponent, NavAction, GardenGridSlotComponent, GridCropInfo } from '../../shared';
import { NotificationService, AppNotification } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import { BottomSheetService } from '../../shared/services/bottom-sheet.service';
import { PlotsActions } from './store/plots.actions';
import { selectSelectedPlot, selectSelectedPlotSlots, selectSlotsLoading } from './store/plots.selectors';
import { Plot, PlotSlot } from './store/plots.state';
import { CropPickerComponent } from './crop-picker.component';
import { Crop } from '../crops/store/crops.state';
import { ScheduleValue } from '../../shared/components/schedule-section/schedule-section.component';

interface GridCell {
  key: string;
  row: number;
  col: number;
  slotId?: string;
  crop?: GridCropInfo;
}

@Component({
  selector: 'app-plot-detail',
  standalone: true,
  imports: [IonContent, TopAppBarComponent, GardenGridSlotComponent, NotificationCentreComponent],
  styleUrl: './plot-detail.page.scss',
  template: `
    <app-top-app-bar [title]="plot()?.name ?? 'Plot'" [actions]="topBarActions()" (actionClick)="onTopBarAction($event)">
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

    <ion-content class="plot-detail-content">

      @if (plot(); as plot) {
        <div class="plot-info">
          <span class="plot-info__chip">{{ plot.rows }}×{{ plot.cols }} grid</span>
          @if (plot.substrate) {
            <span class="plot-info__chip">{{ plot.substrate }}</span>
          }
        </div>

        @if (slotsLoading()) {
          <div class="plot-grid-skeleton">Loading grid…</div>
        } @else {
          <div class="plot-grid-scroll">
            <div class="plot-grid" [style.--grid-cols]="plot.cols">
              @for (cell of buildGrid(plot, slots()); track cell.key) {
                <app-garden-grid-slot
                  [crop]="cell.crop"
                  [empty]="!cell.crop"
                  (slotClicked)="onSlotClick(plot.id, cell)"
                  (slotRemoveRequested)="onRemoveSlot(plot.id, cell)"
                />
              }
            </div>
          </div>
        }
      }

    </ion-content>
  `,
})
export class PlotDetailPage implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sheet = inject(BottomSheetService);
  private readonly alert = inject(AlertController);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;

  readonly topBarActions = computed<NavAction[]>(() => [
    { id: 'notifications', icon: 'notifications', label: 'Notifications',
      badge: this.notificationService.unreadCount() },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ]);

  readonly plot = toSignal(this.store.select(selectSelectedPlot), { initialValue: null });
  readonly slots = toSignal(this.store.select(selectSelectedPlotSlots), { initialValue: [] });
  readonly slotsLoading = toSignal(this.store.select(selectSlotsLoading), { initialValue: true });

  constructor() {
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(PlotsActions.selectPlot({ id }));
      this.store.dispatch(PlotsActions.loadSlots({ plotId: id }));
    }
  }

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    } else if (id === 'profile') {
      this.goToSettings();
    }
  }

  buildGrid(plot: Plot, slots: PlotSlot[]): GridCell[] {
    const cells: GridCell[] = [];
    for (let r = 0; r < plot.rows; r++) {
      for (let c = 0; c < plot.cols; c++) {
        const slot = slots.find(s => s.row === r && s.col === c);
        cells.push({
          key: `${r}-${c}`,
          row: r,
          col: c,
          slotId: slot?.id,
          crop: slot?.crop
            ? {
                name: slot.crop.name,
                latinName: slot.crop.latin_name,
                imageUrl: slot.crop.thumbnail_url ?? '',
                progress: this.growthProgress(slot.sow_date, slot.crop.days_to_harvest),
              }
            : undefined,
        });
      }
    }
    return cells;
  }

  growthProgress(sowDate: string, daysToHarvest: number): number {
    const elapsed = (Date.now() - new Date(sowDate).getTime()) / 86_400_000;
    return Math.min(100, Math.round((elapsed / daysToHarvest) * 100));
  }

  async onSlotClick(plotId: string, cell: GridCell): Promise<void> {
    // If the slot is already occupied, navigate to specimen detail
    if (cell.crop) {
      if (cell.slotId) {
        this.router.navigate(['/tabs/plots', plotId, 'slots', cell.slotId, 'specimen']);
      }
      return;
    }

    const result = await this.sheet.open({
      component: CropPickerComponent,
      componentProps: { plotId, row: cell.row, col: cell.col },
      breakpoints: [0, 0.6, 1],
      initialBreakpoint: 0.9,
    });

    if (!result) return;

    const { crop, row: r, col: c, wateringSchedule, fertiliseSchedule } = result as {
      crop: Crop;
      row: number;
      col: number;
      wateringSchedule: ScheduleValue;
      fertiliseSchedule: ScheduleValue;
    };
    const today = new Date().toISOString().slice(0, 10);

    this.store.dispatch(PlotsActions.createSlot({
      plotId,
      payload: {
        crop_id: crop.id,
        row: r,
        col: c,
        sow_date: today,
        watering_days_override: wateringSchedule.days,
        watering_interval_weeks: wateringSchedule.intervalWeeks,
        fertilise_days_override: fertiliseSchedule.days,
        fertilise_interval_weeks: fertiliseSchedule.intervalWeeks,
      },
    }));
  }

  async onRemoveSlot(plotId: string, cell: GridCell): Promise<void> {
    if (!cell.slotId || !cell.crop) return;

    const alert = await this.alert.create({
      header: 'Remove crop?',
      message: `Remove ${cell.crop.name} and all its tasks from this slot?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(PlotsActions.deleteSlot({ plotId, slotId: cell.slotId! }));
          },
        },
      ],
    });
    await alert.present();
  }

  goBack(): void {
    this.router.navigate(['/tabs/plots']);
  }

  goToSettings(): void {
    this.router.navigate(['/tabs/settings']);
  }
}
