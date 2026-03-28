import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type IconContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type IconContainerVariant = 'primary' | 'secondary' | 'surface' | 'tertiary';

@Component({
  selector: 'app-icon-container',
  standalone: true,
  imports: [NgClass],
  styleUrl: './icon-container.component.scss',
  template: `
    <div
      class="icon-container"
      [ngClass]="['icon-container--' + size, 'icon-container--' + variant]"
      [attr.aria-hidden]="true"
    >
      <span class="material-symbols-outlined">{{ icon }}</span>
    </div>
  `,
})
export class IconContainerComponent {
  @Input({ required: true }) icon!: string;
  @Input() size: IconContainerSize = 'md';
  @Input() variant: IconContainerVariant = 'primary';
}
