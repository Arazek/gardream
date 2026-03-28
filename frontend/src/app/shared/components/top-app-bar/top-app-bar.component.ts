import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-top-app-bar',
  standalone: true,
  styleUrl: './top-app-bar.component.scss',
  template: `
    <header class="top-app-bar">
      <div class="top-app-bar__leading">
        <ng-content select="[leading]" />
      </div>
      @if (title) {
        <span class="top-app-bar__title">{{ title }}</span>
      }
      <div class="top-app-bar__trailing">
        <ng-content select="[trailing]" />
      </div>
    </header>
  `,
})
export class TopAppBarComponent {
  @Input() title?: string;
}
