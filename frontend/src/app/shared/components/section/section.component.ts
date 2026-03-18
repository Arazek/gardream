import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-section',
  standalone: true,
  styleUrl: './section.component.scss',
  template: `
    <div class="section">
      @if (title) {
        <div class="section__header">
          <h3 class="section__title">{{ title }}</h3>
          @if (seeAllLabel) {
            <button class="section__see-all" (click)="seeAll.emit()">
              {{ seeAllLabel }}
            </button>
          }
        </div>
      }
      <div class="section__content">
        <ng-content />
      </div>
    </div>
  `,
})
export class SectionComponent {
  @Input() title = '';
  @Input() seeAllLabel = '';
  @Output() seeAll = new EventEmitter<void>();
}
