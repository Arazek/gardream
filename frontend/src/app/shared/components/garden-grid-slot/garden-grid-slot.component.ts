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
    <button
      type="button"
      class="garden-grid-slot"
      [ngClass]="{
        'garden-grid-slot--empty': empty || !crop,
        'garden-grid-slot--pressing': pressing
      }"
      (click)="slotClicked.emit()"
      (pointerdown)="onPointerDown($event)"
      (pointerup)="onPointerUp()"
      (pointerleave)="onPointerUp()"
      (contextmenu)="$event.preventDefault()"
    >
      @if (crop && !empty) {
        <div class="garden-grid-slot__image-wrap">
          <img class="garden-grid-slot__image" [src]="crop.imageUrl" [alt]="crop.name" loading="lazy" />
        </div>
        <p class="garden-grid-slot__name">{{ crop.name }}</p>
        <p class="garden-grid-slot__latin">{{ crop.latinName }}</p>
        <app-progress-bar [value]="crop.progress" />
        @if (pressing) {
          <div class="garden-grid-slot__remove-hint">
            <span class="material-symbols-outlined">delete</span>
          </div>
        }
      } @else {
        <div class="garden-grid-slot__empty-circle">
          <span class="material-symbols-outlined">add</span>
        </div>
      }
    </button>
  `,
})
export class GardenGridSlotComponent {
  @Input() crop?: GridCropInfo;
  @Input() empty = false;
  @Output() slotClicked = new EventEmitter<void>();
  @Output() slotRemoveRequested = new EventEmitter<void>();

  pressing = false;
  private pressTimer: ReturnType<typeof setTimeout> | null = null;

  onPointerDown(event: PointerEvent): void {
    if (!this.crop || this.empty) return;
    this.pressing = true;
    this.pressTimer = setTimeout(() => {
      this.pressing = false;
      this.slotRemoveRequested.emit();
    }, LONG_PRESS_MS);
  }

  onPointerUp(): void {
    this.pressing = false;
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }
}
