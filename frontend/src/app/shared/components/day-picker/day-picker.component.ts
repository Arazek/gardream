import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

@Component({
  selector: 'app-day-picker',
  standalone: true,
  imports: [NgClass],
  styleUrl: './day-picker.component.scss',
  template: `
    <div class="day-picker" role="group" aria-label="Select watering days">
      @for (day of days; track $index) {
        <button
          type="button"
          class="day-picker__btn"
          [ngClass]="{ 'day-picker__btn--active': selected.includes($index) }"
          [attr.aria-pressed]="selected.includes($index)"
          [attr.aria-label]="day"
          (click)="toggle($index)"
        >
          {{ day }}
        </button>
      }
    </div>
  `,
})
export class DayPickerComponent {
  readonly days = DAYS;

  @Input() selected: number[] = [];
  @Output() selectedChange = new EventEmitter<number[]>();

  toggle(index: number) {
    const next = this.selected.includes(index)
      ? this.selected.filter(d => d !== index)
      : [...this.selected, index].sort((a, b) => a - b);
    this.selectedChange.emit(next);
  }
}
