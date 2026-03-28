import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IconContainerComponent } from '../icon-container/icon-container.component';

@Component({
  selector: 'app-insight-card',
  standalone: true,
  imports: [IconContainerComponent],
  styleUrl: './insight-card.component.scss',
  template: `
    <div class="insight-card">
      <p class="insight-card__text">{{ insight }}</p>
      <div class="insight-card__footer">
        <div class="insight-card__identity">
          <app-icon-container icon="eco" size="sm" variant="primary" />
          <span class="insight-card__identity-label">Arboretum Assistant</span>
        </div>
        @if (cta) {
          <button type="button" class="insight-card__cta" (click)="ctaClicked.emit()">
            {{ cta }}
          </button>
        }
      </div>
    </div>
  `,
})
export class InsightCardComponent {
  @Input({ required: true }) insight!: string;
  @Input() cta?: string;
  @Output() ctaClicked = new EventEmitter<void>();
}
