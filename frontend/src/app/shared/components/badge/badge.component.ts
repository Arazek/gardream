import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'medium';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgClass],
  styleUrl: './badge.component.scss',
  template: `
    <span class="badge" [ngClass]="'badge--' + variant">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'primary';
}
