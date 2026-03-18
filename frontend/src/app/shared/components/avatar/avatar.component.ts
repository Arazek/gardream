import { Component, Input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { InitialsPipe } from '../../pipes/initials.pipe';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 48, xl: 64 };

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [NgClass, NgStyle, InitialsPipe],
  styleUrl: './avatar.component.scss',
  template: `
    <div
      class="avatar"
      [ngClass]="'avatar--' + size"
      [ngStyle]="{ width: sizePx + 'px', height: sizePx + 'px' }"
    >
      @if (src) {
        <img class="avatar__image" [src]="src" [alt]="name" (error)="onImgError()" />
      } @else {
        <span class="avatar__initials">{{ name | initials }}</span>
      }
    </div>
  `,
})
export class AvatarComponent {
  @Input() src = '';
  @Input() name = '';
  @Input() size: AvatarSize = 'md';

  get sizePx(): number {
    return SIZE_PX[this.size];
  }

  onImgError(): void {
    this.src = '';
  }
}
