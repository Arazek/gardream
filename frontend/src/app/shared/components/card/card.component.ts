import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

export type CardVariant = 'none' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgClass],
  styleUrl: './card.component.scss',
  template: `
    <div
      class="card"
      [ngClass]="[
        clickable ? 'card--clickable' : '',
        flat ? 'card--flat' : '',
        variant !== 'none' ? 'card--' + variant : ''
      ]"
      (click)="clickable && cardClick.emit()"
    >
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  @Input() variant: CardVariant = 'none';
  @Input() clickable = false;
  @Input() flat = false;
  @Output() cardClick = new EventEmitter<void>();
}
