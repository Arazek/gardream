import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconContainerComponent } from '../icon-container/icon-container.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [NgClass, IconContainerComponent],
  styleUrl: './task-card.component.scss',
  template: `
    <div class="task-card" [ngClass]="{ 'task-card--completed': completed }">
      <div class="task-card__icon">
        <app-icon-container [icon]="icon" size="md" [variant]="completed ? 'surface' : 'primary'" />
      </div>
      <div class="task-card__body">
        <p class="task-card__title">{{ title }}</p>
        @if (description) {
          <p class="task-card__description">{{ description }}</p>
        }
        @if (timestamp) {
          <p class="task-card__timestamp">{{ timestamp }}</p>
        }
      </div>
      <button
        type="button"
        class="task-card__checkbox"
        [class.task-card__checkbox--checked]="completed"
        [attr.aria-label]="completed ? 'Mark incomplete' : 'Mark complete'"
        (click)="completedChange.emit(!completed)"
      >
        @if (completed) {
          <span class="material-symbols-outlined">check</span>
        }
      </button>
    </div>
  `,
})
export class TaskCardComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() timestamp?: string;
  @Input() completed = false;
  @Output() completedChange = new EventEmitter<boolean>();
}
