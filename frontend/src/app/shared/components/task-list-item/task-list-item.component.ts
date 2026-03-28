import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconContainerComponent, IconContainerVariant } from '../icon-container/icon-container.component';

@Component({
  selector: 'app-task-list-item',
  standalone: true,
  imports: [NgClass, IconContainerComponent],
  styleUrl: './task-list-item.component.scss',
  template: `
    <div class="task-list-item" [ngClass]="{ 'task-list-item--completed': completed, 'task-list-item--overdue': overdue && !completed }">
      <app-icon-container [icon]="icon" size="sm" [variant]="iconVariant" />
      <div class="task-list-item__content">
        <p class="task-list-item__title">{{ title }}</p>
        @if (subtitle) {
          <p class="task-list-item__subtitle">{{ subtitle }}</p>
        }
      </div>
      <button
        type="button"
        class="task-list-item__checkbox"
        [class.task-list-item__checkbox--checked]="completed"
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
export class TaskListItemComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() completed = false;
  @Input() overdue = false;
  @Output() completedChange = new EventEmitter<boolean>();

  get iconVariant(): IconContainerVariant {
    if (this.overdue && !this.completed) return 'tertiary';
    if (this.completed) return 'surface';
    return 'primary';
  }
}
