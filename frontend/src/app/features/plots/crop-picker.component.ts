import { Component, OnInit, Input, inject } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import { SearchBarComponent, FilterChipComponent, SpecimenCardComponent } from '../../shared';
import { CropsActions } from '../crops/store/crops.actions';
import { selectFilteredCrops, selectCropsLoading } from '../crops/store/crops.selectors';
import { Crop, CropCategory } from '../crops/store/crops.state';
import { BottomSheetService } from '../../shared/services/bottom-sheet.service';
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
  ],
  styleUrl: './crop-picker.component.scss',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Choose a Crop</ion-title>
        <ion-button slot="end" fill="clear" (click)="dismiss()">Cancel</ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="crop-picker-content">
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

  activeCategory: CropCategory | null = null;
  searchQuery = '';
  allCrops: Crop[] = [];
  displayCrops: Crop[] = [];

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
    this.sheet.dismiss({ crop, row: this.row, col: this.col });
  }

  dismiss(): void {
    this.sheet.dismiss(null);
  }

  private applySearch(): void {
    this.displayCrops = this.searchQuery
      ? this.allCrops.filter(c =>
          c.name.toLowerCase().includes(this.searchQuery) ||
          c.latin_name.toLowerCase().includes(this.searchQuery),
        )
      : this.allCrops;
  }
}
