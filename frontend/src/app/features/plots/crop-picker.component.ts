import { Component, OnInit, Input, inject } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { SearchBarComponent, FilterChipComponent, SpecimenCardComponent } from '../../shared';
import { ScheduleSectionComponent, ScheduleValue } from '../../shared/components/schedule-section/schedule-section.component';
import { CropsActions } from '../crops/store/crops.actions';
import { selectFilteredCrops, selectCropsLoading } from '../crops/store/crops.selectors';
import { Crop, CropCategory } from '../crops/store/crops.state';
import { BottomSheetService } from '../../shared/services/bottom-sheet.service';
import { selectSelectedPlot } from './store/plots.selectors';
import { AsyncPipe } from '@angular/common';

interface CategoryOption { value: CropCategory | null; label: string; }

const CATEGORIES: CategoryOption[] = [
  { value: null,        label: 'All' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'herb',      label: 'Herbs' },
  { value: 'fruit',     label: 'Fruit' },
  { value: 'flower',    label: 'Flowers' },
];

@Component({
  selector: 'app-crop-picker',
  standalone: true,
  imports: [
    AsyncPipe,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
    SearchBarComponent, FilterChipComponent, SpecimenCardComponent,
    ScheduleSectionComponent,
  ],
  styleUrl: './crop-picker.component.scss',
  template: `
    <ion-header>
      <ion-toolbar>
        @if (selectedCrop) {
          <ion-button slot="start" fill="clear" (click)="clearSelection()">Back</ion-button>
          <ion-title>Schedule</ion-title>
          <ion-button slot="end" fill="clear" (click)="confirm()">Plant</ion-button>
        } @else {
          <ion-title>Choose a Crop</ion-title>
          <ion-button slot="end" fill="clear" (click)="dismiss()">Cancel</ion-button>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content class="crop-picker-content">

      @if (!selectedCrop) {
        <div class="crop-picker-search">
          <app-search-bar placeholder="Search crops…" (search)="onSearch($event)" />
        </div>

        <div class="crop-picker-filters">
          @for (cat of categories; track cat.label) {
            <app-filter-chip
              [label]="cat.label"
              [active]="activeCategory === cat.value"
              (toggled)="setCategory(cat.value)"
            />
          }
        </div>

        <div class="crop-picker-grid">
          @if (loading$ | async) {
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="crop-picker-skeleton"></div>
            }
          } @else {
            @for (crop of displayCrops; track crop.id) {
              <app-specimen-card
                [crop]="crop"
                size="compact"
                (click)="selectCrop(crop)"
              />
            }
          }
        </div>
      } @else {
        <div class="crop-picker-schedule">
          <div class="crop-picker-sow-date">
            <label class="crop-picker-sow-date__label">DATE PLANTED</label>
            <input
              class="crop-picker-sow-date__input"
              type="date"
              [value]="sowDate"
              [max]="today"
              (change)="onSowDateChange($event)"
            />
          </div>
          <app-schedule-section
            label="WATERING"
            toggleLabel="Use plot default"
            [defaultDays]="plotWateringDays"
            [days]="wateringSchedule.days"
            [intervalWeeks]="wateringSchedule.intervalWeeks"
            (scheduleChange)="onWateringChange($event)"
          />
          <app-schedule-section
            label="FERTILISATION"
            toggleLabel="Use plot default"
            [defaultDays]="plotFertiliseDays"
            [days]="fertiliseSchedule.days"
            [intervalWeeks]="fertiliseSchedule.intervalWeeks"
            (scheduleChange)="onFertiliseChange($event)"
          />
        </div>
      }

    </ion-content>
  `,
})
export class CropPickerComponent implements OnInit {
  @Input() plotId!: string;
  @Input() row!: number;
  @Input() col!: number;

  private readonly store = inject(Store);
  private readonly sheet = inject(BottomSheetService);

  readonly loading$ = this.store.select(selectCropsLoading);
  readonly categories = CATEGORIES;

  readonly plot = toSignal(this.store.select(selectSelectedPlot), { initialValue: null });

  activeCategory: CropCategory | null = null;
  searchQuery = '';
  allCrops: Crop[] = [];
  displayCrops: Crop[] = [];

  selectedCrop: Crop | null = null;

  readonly today = new Date().toISOString().slice(0, 10);
  sowDate = this.today;

  wateringSchedule: ScheduleValue = { days: null, intervalWeeks: 1 };
  fertiliseSchedule: ScheduleValue = { days: null, intervalWeeks: 1 };

  get plotWateringDays(): number[] {
    return this.plot()?.watering_days ?? [];
  }

  get plotFertiliseDays(): number[] {
    return this.plot()?.fertilise_days ?? [];
  }

  ngOnInit(): void {
    this.store.dispatch(CropsActions.loadCrops({}));
    this.store.select(selectFilteredCrops).subscribe(crops => {
      this.allCrops = crops;
      this.applySearch();
    });
  }

  onSearch(q: string): void {
    this.searchQuery = q.toLowerCase();
    this.applySearch();
  }

  setCategory(cat: CropCategory | null): void {
    this.activeCategory = cat;
    this.store.dispatch(CropsActions.setCategoryFilter({ category: cat }));
  }

  selectCrop(crop: Crop): void {
    this.selectedCrop = crop;
  }

  clearSelection(): void {
    this.selectedCrop = null;
  }

  onSowDateChange(event: Event): void {
    this.sowDate = (event.target as HTMLInputElement).value || this.today;
  }

  onWateringChange(v: ScheduleValue): void {
    this.wateringSchedule = v;
  }

  onFertiliseChange(v: ScheduleValue): void {
    this.fertiliseSchedule = v;
  }

  confirm(): void {
    if (!this.selectedCrop) return;
    this.sheet.dismiss({
      crop: this.selectedCrop,
      row: this.row,
      col: this.col,
      sowDate: this.sowDate,
      wateringSchedule: this.wateringSchedule,
      fertiliseSchedule: this.fertiliseSchedule,
    });
  }

  dismiss(): void {
    this.sheet.dismiss(null);
  }

  private applySearch(): void {
    this.displayCrops = this.searchQuery
      ? this.allCrops.filter(c => c.name.toLowerCase().includes(this.searchQuery))
      : this.allCrops;
  }
}
