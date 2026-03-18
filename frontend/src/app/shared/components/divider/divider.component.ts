import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-divider',
  standalone: true,
  styleUrl: './divider.component.scss',
  template: `
    <div class="divider">
      @if (label) {
        <span class="divider__label">{{ label }}</span>
      }
    </div>
  `,
})
export class DividerComponent {
  @Input() label = '';
}
