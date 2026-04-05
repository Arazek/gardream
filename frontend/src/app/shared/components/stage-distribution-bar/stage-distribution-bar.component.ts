import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StageItem {
  key: string;
  icon: string;
  label: string;
  count: number;
}

const STAGE_DEFS = [
  { key: 'germinating',   icon: 'eco',           label: 'Germinating' },
  { key: 'seedling',      icon: 'grass',         label: 'Seedling' },
  { key: 'vegetative',    icon: 'forest',        label: 'Vegetative' },
  { key: 'flowering',     icon: 'local_florist', label: 'Flowering' },
  { key: 'harvest-ready', icon: 'nutrition',     label: 'Ready' },
];

@Component({
  selector: 'app-stage-distribution-bar',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './stage-distribution-bar.component.scss',
  template: `
    <div class="stage-bar">
      @for (stage of stages; track stage.key) {
        <div class="stage-bar__item" [class.stage-bar__item--active]="stage.count > 0">
          <span class="material-symbols-outlined stage-bar__icon" aria-hidden="true">{{ stage.icon }}</span>
          <span class="stage-bar__count">{{ stage.count }}</span>
          <span class="stage-bar__label">{{ stage.label }}</span>
        </div>
        @if (!$last) {
          <span class="material-symbols-outlined stage-bar__arrow" aria-hidden="true">chevron_right</span>
        }
      }
    </div>
  `,
})
export class StageDistributionBarComponent {
  stages: StageItem[] = STAGE_DEFS.map(def => ({ ...def, count: 0 }));

  @Input() set distribution(val: Record<string, number>) {
    this.stages = STAGE_DEFS.map(def => ({
      ...def,
      count: val[def.key] ?? 0,
    }));
  }
}
