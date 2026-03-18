import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trashOutline,
  leafOutline,
  checkmarkOutline,
  closeOutline,
  informationCircleOutline,
  gridOutline,
} from 'ionicons/icons';

import {
  PageHeaderComponent,
  SectionComponent,
  CardComponent,
  ChipComponent,
  BadgeComponent,
} from '../../../../shared';

export interface CropPalette {
  id: string;
  name: string;
  color: string;
  category: 'vegetable' | 'herb' | 'fruit';
}

export interface Planter {
  id: string;
  name: string;
  rows: number;
  cols: number;
  grid: (string | null)[][];
}

const CROP_PALETTE: CropPalette[] = [
  { id: '1', name: 'Tomato', color: '#ef4444', category: 'vegetable' },
  { id: '2', name: 'Basil', color: '#22c55e', category: 'herb' },
  { id: '3', name: 'Carrot', color: '#f97316', category: 'vegetable' },
  { id: '4', name: 'Lettuce', color: '#84cc16', category: 'vegetable' },
  { id: '5', name: 'Mint', color: '#10b981', category: 'herb' },
  { id: '6', name: 'Cucumber', color: '#65a30d', category: 'vegetable' },
  { id: '7', name: 'Pepper', color: '#f59e0b', category: 'vegetable' },
  { id: '8', name: 'Spinach', color: '#16a34a', category: 'vegetable' },
  { id: '9', name: 'Rosemary', color: '#6d28d9', category: 'herb' },
  { id: '10', name: 'Strawberry', color: '#e11d48', category: 'fruit' },
];

function makeEmptyGrid(rows: number, cols: number): (string | null)[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

@Component({
  selector: 'app-garden-builder',
  standalone: true,
  imports: [
    NgClass,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    PageHeaderComponent,
    SectionComponent,
    CardComponent,
    ChipComponent,
    BadgeComponent,
  ],
  styleUrl: './garden-builder.page.scss',
  template: `
    <app-page-header
      title="Garden Builder"
      [showBack]="true"
      backHref="/tabs/garden"
    />

    <ion-content class="builder-content">

      <!-- Planter selector -->
      <app-section title="Planters">
        <div class="planter-tabs">
          @for (planter of planters; track planter.id) {
            <button
              class="planter-tab"
              [class.planter-tab--active]="selectedPlanterId === planter.id"
              (click)="selectPlanter(planter.id)"
            >
              <ion-icon name="grid-outline" />
              {{ planter.name }}
            </button>
          }
          <button class="planter-tab planter-tab--add" (click)="addPlanter()">
            <ion-icon name="add-outline" />
            New
          </button>
        </div>
      </app-section>

      <!-- Selected crop tool -->
      <app-section>
        <div class="tool-bar">
          <span class="tool-bar__label">Selected crop:</span>
          @if (selectedCrop) {
            <div class="tool-bar__selected">
              <span
                class="tool-bar__dot"
                [style.background]="selectedCrop.color"
              ></span>
              <span class="tool-bar__crop-name">{{ selectedCrop.name }}</span>
              <button
                class="tool-bar__clear"
                (click)="selectedCrop = null"
                aria-label="Clear selection"
              >
                <ion-icon name="close-outline" />
              </button>
            </div>
          } @else {
            <span class="tool-bar__hint">Tap a crop below, then tap a cell</span>
          }

          @if (selectedCell) {
            <button
              class="tool-bar__erase"
              (click)="clearCell(selectedCell!.row, selectedCell!.col)"
              aria-label="Clear selected cell"
            >
              <ion-icon name="trash-outline" />
              Clear cell
            </button>
          }
        </div>
      </app-section>

      <!-- Crop palette -->
      <app-section title="Crop Palette">
        <div class="crop-palette">
          @for (crop of cropPalette; track crop.id) {
            <button
              class="crop-chip"
              [class.crop-chip--active]="selectedCrop?.id === crop.id"
              (click)="selectCropTool(crop)"
              [attr.aria-pressed]="selectedCrop?.id === crop.id"
            >
              <span class="crop-chip__dot" [style.background]="crop.color"></span>
              {{ crop.name }}
            </button>
          }
        </div>
      </app-section>

      <!-- Grid -->
      @if (activePlanter) {
        <app-section [title]="activePlanter.name + ' — ' + activePlanter.rows + '×' + activePlanter.cols + ' grid'">
          <div class="grid-wrap">
            <div
              class="planter-grid"
              [style.grid-template-columns]="'repeat(' + activePlanter.cols + ', 1fr)'"
            >
              @for (row of activePlanter.grid; track $index; let rowIndex = $index) {
                @for (cell of row; track $index; let colIndex = $index) {
                  <button
                    class="grid-cell"
                    [class.grid-cell--filled]="cell !== null"
                    [class.grid-cell--selected]="isSelected(rowIndex, colIndex)"
                    [style.background]="getCellColor(cell)"
                    (click)="onCellClick(rowIndex, colIndex)"
                    [attr.aria-label]="getCellLabel(cell, rowIndex, colIndex)"
                  >
                    @if (cell !== null) {
                      <span class="grid-cell__abbr">{{ getCropAbbr(cell) }}</span>
                    }
                    @if (isSelected(rowIndex, colIndex)) {
                      <ion-icon class="grid-cell__check" name="checkmark-outline" />
                    }
                  </button>
                }
              }
            </div>
          </div>

          <!-- Legend -->
          <div class="grid-legend">
            @for (entry of gridCropLegend; track entry.cropId) {
              <div class="legend-item">
                <span class="legend-item__dot" [style.background]="entry.color"></span>
                <span class="legend-item__name">{{ entry.name }}</span>
                <span class="legend-item__count">× {{ entry.count }}</span>
              </div>
            }
            @if (gridCropLegend.length === 0) {
              <p class="grid-legend__empty">No crops planted yet — select a crop and tap a cell</p>
            }
          </div>
        </app-section>
      }

      <!-- Cell info panel -->
      @if (selectedCell && activePlanter) {
        <app-section>
          <app-card>
            <div class="cell-info">
              <ion-icon
                class="cell-info__icon"
                [name]="getCellCrop(selectedCell.row, selectedCell.col) ? 'leaf-outline' : 'grid-outline'"
              />
              <div class="cell-info__body">
                <p class="cell-info__title">
                  Cell ({{ selectedCell.row + 1 }}, {{ selectedCell.col + 1 }})
                </p>
                <p class="cell-info__value">
                  {{ getCellCrop(selectedCell.row, selectedCell.col)?.name ?? 'Empty cell' }}
                </p>
              </div>
              @if (getCellCrop(selectedCell.row, selectedCell.col)) {
                <button
                  class="cell-info__view-btn"
                  (click)="goToCropDetail(getCellCrop(selectedCell!.row, selectedCell!.col)!.id)"
                  aria-label="View crop details"
                >
                  <ion-icon name="information-circle-outline" />
                </button>
              }
            </div>
          </app-card>
        </app-section>
      }

      <div style="height: 40px;"></div>

    </ion-content>
  `,
})
export class GardenBuilderPage implements OnInit {
  cropPalette: CropPalette[] = CROP_PALETTE;
  selectedCrop: CropPalette | null = null;
  selectedCell: { row: number; col: number } | null = null;

  planters: Planter[] = [
    {
      id: 'A',
      name: 'Raised Bed A',
      rows: 4,
      cols: 6,
      grid: makeEmptyGrid(4, 6),
    },
    {
      id: 'B',
      name: 'Raised Bed B',
      rows: 3,
      cols: 5,
      grid: makeEmptyGrid(3, 5),
    },
  ];

  selectedPlanterId = 'A';

  get activePlanter(): Planter | undefined {
    return this.planters.find((p) => p.id === this.selectedPlanterId);
  }

  get gridCropLegend(): { cropId: string; name: string; color: string; count: number }[] {
    const planter = this.activePlanter;
    if (!planter) return [];

    const counts = new Map<string, number>();
    for (const row of planter.grid) {
      for (const cropId of row) {
        if (cropId) counts.set(cropId, (counts.get(cropId) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries()).map(([cropId, count]) => {
      const crop = this.cropPalette.find((c) => c.id === cropId);
      return { cropId, name: crop?.name ?? cropId, color: crop?.color ?? '#ccc', count };
    });
  }

  isSelected(row: number, col: number): boolean {
    return this.selectedCell?.row === row && this.selectedCell?.col === col;
  }

  getCellColor(cropId: string | null): string {
    if (!cropId) return '';
    const crop = this.cropPalette.find((c) => c.id === cropId);
    return crop ? crop.color + '33' : '';
  }

  getCellLabel(cropId: string | null, row: number, col: number): string {
    const crop = cropId ? this.cropPalette.find((c) => c.id === cropId) : null;
    return crop
      ? `Row ${row + 1}, Col ${col + 1}: ${crop.name}`
      : `Row ${row + 1}, Col ${col + 1}: Empty`;
  }

  getCropAbbr(cropId: string): string {
    const crop = this.cropPalette.find((c) => c.id === cropId);
    return crop ? crop.name.slice(0, 2).toUpperCase() : '??';
  }

  getCellCrop(row: number, col: number): CropPalette | null {
    const planter = this.activePlanter;
    if (!planter) return null;
    const cropId = planter.grid[row]?.[col];
    return cropId ? (this.cropPalette.find((c) => c.id === cropId) ?? null) : null;
  }

  selectPlanter(id: string): void {
    this.selectedPlanterId = id;
    this.selectedCell = null;
  }

  selectCropTool(crop: CropPalette): void {
    this.selectedCrop = this.selectedCrop?.id === crop.id ? null : crop;
  }

  onCellClick(row: number, col: number): void {
    const planter = this.activePlanter;
    if (!planter) return;

    if (this.selectedCrop) {
      planter.grid[row][col] = planter.grid[row][col] === this.selectedCrop.id
        ? null
        : this.selectedCrop.id;
      this.selectedCell = { row, col };
    } else {
      this.selectedCell = this.isSelected(row, col) ? null : { row, col };
    }
  }

  clearCell(row: number, col: number): void {
    const planter = this.activePlanter;
    if (!planter) return;
    planter.grid[row][col] = null;
    this.selectedCell = null;
  }

  addPlanter(): void {
    const id = String.fromCharCode(65 + this.planters.length);
    this.planters.push({
      id,
      name: `Raised Bed ${id}`,
      rows: 3,
      cols: 4,
      grid: makeEmptyGrid(3, 4),
    });
    this.selectPlanter(id);
  }

  goToCropDetail(cropId: string): void {
    this.router.navigateByUrl(`/tabs/garden/crop/${cropId}`);
  }

  constructor(private router: Router) {
    addIcons({
      addOutline,
      trashOutline,
      leafOutline,
      checkmarkOutline,
      closeOutline,
      informationCircleOutline,
      gridOutline,
    });
  }

  ngOnInit(): void {}
}
