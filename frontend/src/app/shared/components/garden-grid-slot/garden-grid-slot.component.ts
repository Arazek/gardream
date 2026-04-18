import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

export interface GridCropInfo {
  name: string;
  latinName: string;
  imageUrl: string;
  progress: number;
}

const LONG_PRESS_MS = 600;

@Component({
  selector: 'app-garden-grid-slot',
  standalone: true,
  imports: [NgClass, ProgressBarComponent],
  styleUrl: './garden-grid-slot.component.scss',
  template: `
    <div class="garden-grid-slot" [ngClass]="{ 'garden-grid-slot--empty': empty || !crop }">
      @if (crop && !empty) {
        <button
          type="button"
          class="garden-grid-slot__content"
          (click)="slotClicked.emit()"
          (pointerdown)="onPointerDown()"
          (pointerup)="onPointerUp()"
          (pointerleave)="onPointerUp()"
          [attr.aria-label]="crop.name + ' crop slot'"
        >
          <div class="garden-grid-slot__image-wrap">
            <img class="garden-grid-slot__image" [src]="crop.imageUrl" [alt]="crop.name" loading="lazy" />
          </div>
          <div class="garden-grid-slot__info">
            <p class="garden-grid-slot__name">{{ crop.name }}</p>
            <p class="garden-grid-slot__latin">{{ crop.latinName }}</p>
          </div>
          <app-progress-bar [value]="crop.progress" />
          @if (germinationDate !== undefined) {
            <span class="garden-grid-slot__germination-badge" [class.germinated]="germinationDate">
              {{ germinationDate ? '🌱' : '🌰' }}
            </span>
          }
        </button>
        <button
          type="button"
          class="garden-grid-slot__remove-btn"
          aria-label="Remove crop"
          (click)="slotRemoveRequested.emit()"
          title="Remove this crop"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
        @if (pressing) {
          <div class="garden-grid-slot__press-feedback"></div>
        }
      } @else {
        <button
          type="button"
          class="garden-grid-slot__empty-btn"
          (click)="slotClicked.emit()"
          aria-label="Add crop to this slot"
        >
          <div class="garden-grid-slot__empty-circle">
            <span class="material-symbols-outlined">add</span>
          </div>
        </button>
      }
    </div>
  `,
})
export class GardenGridSlotComponent {
  @Input() crop?: GridCropInfo;
  @Input() empty = false;
  @Input() germinationDate?: string | null;
  @Output() slotClicked = new EventEmitter<void>();
  @Output() slotRemoveRequested = new EventEmitter<void>();

  pressing = false;
  private pressTimer: ReturnType<typeof setTimeout> | null = null;

  onPointerDown(): void {
    if (!this.crop || this.empty) return;
    // Keep visual feedback for consistency, but remove button is now explicit
    this.pressing = true;
    this.pressTimer = setTimeout(() => {
      this.pressing = false;
    }, 200); // Just visual feedback, no action
  }

  onPointerUp(): void {
    this.pressing = false;
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }
}
