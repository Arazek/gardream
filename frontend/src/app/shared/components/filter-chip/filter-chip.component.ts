import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-filter-chip',
  standalone: true,
  imports: [NgClass],
  styleUrl: './filter-chip.component.scss',
  template: `
    <button
      type="button"
      class="filter-chip"
      [ngClass]="{ 'filter-chip--active': active }"
      [attr.aria-pressed]="active"
      (click)="toggled.emit()"
    >
      {{ label }}
    </button>
  `,
})
export class FilterChipComponent {
  @Input({ required: true }) label!: string;
  @Input() active = false;
  @Output() toggled = new EventEmitter<void>();
}
