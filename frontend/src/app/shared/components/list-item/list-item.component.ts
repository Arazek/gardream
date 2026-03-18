import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonItem, IonLabel, IonNote } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [IonItem, IonLabel, IonNote, AvatarComponent],
  styleUrl: './list-item.component.scss',
  template: `
    <ion-item
      class="list-item"
      [detail]="showChevron"
      [button]="clickable"
      [lines]="lines"
      (click)="clickable && itemClick.emit()"
    >
      @if (avatarSrc || avatarName) {
        <app-avatar slot="start" [src]="avatarSrc" [name]="avatarName" size="md" />
      }

      <ion-label class="list-item__label">
        <h2 class="list-item__title">{{ title }}</h2>
        @if (subtitle) {
          <p class="list-item__subtitle">{{ subtitle }}</p>
        }
      </ion-label>

      @if (meta) {
        <ion-note slot="end" class="list-item__meta">{{ meta }}</ion-note>
      }

      <ng-content slot="end" />
    </ion-item>
  `,
})
export class ListItemComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() meta = '';
  @Input() avatarSrc = '';
  @Input() avatarName = '';
  @Input() clickable = false;
  @Input() showChevron = false;
  @Input() lines: 'full' | 'inset' | 'none' = 'inset';
  @Output() itemClick = new EventEmitter<void>();

  constructor() {
    addIcons({ chevronForwardOutline });
  }
}
