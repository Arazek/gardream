import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

export type LogoSize = 'sm' | 'md' | 'lg';
const SIZE_PX: Record<LogoSize, number> = { sm: 32, md: 48, lg: 72 };

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgStyle],
  styleUrl: './logo.component.scss',
  template: `
    <div class="logo" [ngStyle]="{ width: sizePx + 'px', height: sizePx + 'px' }">
      @if (src) {
        <img class="logo__image" [src]="src" alt="Logo" />
      } @else {
        <span class="logo__text">{{ appName[0] }}</span>
      }
    </div>
  `,
})
export class LogoComponent {
  @Input() src = '';
  @Input() appName = 'App';
  @Input() size: LogoSize = 'md';

  get sizePx(): number {
    return SIZE_PX[this.size];
  }
}
