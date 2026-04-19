import {
  Component, Input, Output, EventEmitter, ElementRef, ViewChild,
  OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { PlotSlot } from './store/plots.state';

export interface PhotoRect {
  x_pct: number;
  y_pct: number;
  w_pct: number;
  h_pct: number;
}

@Component({
  selector: 'app-plot-photo-overlay',
  standalone: true,
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './plot-photo-overlay.component.scss',
  template: `
    <div
      #container
      class="photo-overlay"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="cancelDraw()"
    >
      <img [src]="photoUrl" class="photo-overlay__img" draggable="false" />

      @for (slot of slots; track slot.id) {
        <div
          class="photo-slot"
          [class.photo-slot--occupied]="!!slot.crop"
          [ngStyle]="slotStyle(slot)"
          (click)="onSlotClick($event, slot)"
        >
          <span class="photo-slot__label">{{ slot.crop?.name ?? '?' }}</span>
          <button
            class="photo-slot__remove"
            aria-label="Remove slot"
            (click)="onRemoveClick($event, slot)"
          >×</button>
        </div>
      }

      @if (drawing && preview) {
        <div class="photo-slot photo-slot--preview" [ngStyle]="previewStyle()"></div>
      }
    </div>
  `,
})
export class PlotPhotoOverlayComponent implements OnDestroy {
  @Input() photoUrl!: string;
  @Input() slots: PlotSlot[] = [];
  @Input() isSeedlingTray = false;

  @Output() slotClicked = new EventEmitter<PlotSlot>();
  @Output() slotRemoveRequested = new EventEmitter<PlotSlot>();
  @Output() newRectDrawn = new EventEmitter<PhotoRect>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  drawing = false;
  preview: PhotoRect | null = null;

  private startX = 0;
  private startY = 0;
  private pointerId: number | null = null;

  slotStyle(slot: PlotSlot): Record<string, string> {
    return {
      left: `${slot.x_pct}%`,
      top: `${slot.y_pct}%`,
      width: `${slot.w_pct}%`,
      height: `${slot.h_pct}%`,
    };
  }

  previewStyle(): Record<string, string> {
    if (!this.preview) return {};
    return {
      left: `${this.preview.x_pct}%`,
      top: `${this.preview.y_pct}%`,
      width: `${this.preview.w_pct}%`,
      height: `${this.preview.h_pct}%`,
    };
  }

  onPointerDown(event: PointerEvent): void {
    if (event.target !== this.containerRef.nativeElement &&
        !(event.target as HTMLElement).classList.contains('photo-overlay__img')) {
      return; // click on slot or button — don't start draw
    }
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.containerRef.nativeElement.setPointerCapture(event.pointerId);
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    this.startX = (event.clientX - rect.left) / rect.width * 100;
    this.startY = (event.clientY - rect.top) / rect.height * 100;
    this.drawing = true;
    this.preview = { x_pct: this.startX, y_pct: this.startY, w_pct: 0, h_pct: 0 };
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const curX = (event.clientX - rect.left) / rect.width * 100;
    const curY = (event.clientY - rect.top) / rect.height * 100;
    this.preview = this.buildRect(this.startX, this.startY, curX, curY);
    this.cdr.markForCheck();
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.drawing || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const curX = (event.clientX - rect.left) / rect.width * 100;
    const curY = (event.clientY - rect.top) / rect.height * 100;
    const final = this.buildRect(this.startX, this.startY, curX, curY);
    this.cancelDraw();
    if (final.w_pct >= 5 && final.h_pct >= 5) {
      this.newRectDrawn.emit(final);
    }
  }

  cancelDraw(): void {
    this.drawing = false;
    this.preview = null;
    this.pointerId = null;
    this.cdr.markForCheck();
  }

  onSlotClick(event: MouseEvent, slot: PlotSlot): void {
    event.stopPropagation();
    this.slotClicked.emit(slot);
  }

  onRemoveClick(event: MouseEvent, slot: PlotSlot): void {
    event.stopPropagation();
    this.slotRemoveRequested.emit(slot);
  }

  ngOnDestroy(): void {
    this.cancelDraw();
  }

  private buildRect(x1: number, y1: number, x2: number, y2: number): PhotoRect {
    const x = Math.max(0, Math.min(x1, x2));
    const y = Math.max(0, Math.min(y1, y2));
    const w = Math.min(Math.abs(x2 - x1), 100 - x);
    const h = Math.min(Math.abs(y2 - y1), 100 - y);
    return { x_pct: x, y_pct: y, w_pct: w, h_pct: h };
  }
}
