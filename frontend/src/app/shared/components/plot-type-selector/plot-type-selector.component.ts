import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconContainerComponent } from '../icon-container/icon-container.component';

export interface PlotTypeOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-plot-type-selector',
  standalone: true,
  imports: [NgClass, IconContainerComponent],
  styleUrl: './plot-type-selector.component.scss',
  template: `
    <div class="plot-type-selector" role="radiogroup">
      @for (opt of options; track opt.value) {
        <button
          type="button"
          class="plot-type-selector__option"
          [ngClass]="{ 'plot-type-selector__option--selected': selected === opt.value }"
          [attr.aria-checked]="selected === opt.value"
          role="radio"
          (click)="selectedChange.emit(opt.value)"
        >
          <app-icon-container [icon]="opt.icon" size="xl"
            [variant]="selected === opt.value ? 'primary' : 'surface'" />
          <span class="plot-type-selector__label">{{ opt.label }}</span>
        </button>
      }
    </div>
  `,
})
export class PlotTypeSelectorComponent {
  @Input({ required: true }) options!: PlotTypeOption[];
  @Input() selected = '';
  @Output() selectedChange = new EventEmitter<string>();
}
