import { Component, Input } from '@angular/core';
import { IconContainerComponent } from '../icon-container/icon-container.component';

@Component({
  selector: 'app-stat-chip',
  standalone: true,
  imports: [IconContainerComponent],
  styleUrl: './stat-chip.component.scss',
  template: `
    <div class="stat-chip">
      <app-icon-container [icon]="icon" size="sm" variant="surface" />
      <div class="stat-chip__text">
        <span class="stat-chip__label">{{ label }}</span>
        <span class="stat-chip__value">{{ value }}</span>
      </div>
    </div>
  `,
})
export class StatChipComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
}
