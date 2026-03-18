import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [IonButton, IonIcon],
  styleUrl: './drawer.component.scss',
  template: `
    <div
      class="drawer-backdrop"
      [class.drawer-backdrop--visible]="open"
      (click)="closed.emit()"
    ></div>

    <div
      class="drawer"
      [class.drawer--open]="open"
      [class.drawer--left]="position === 'left'"
      [style.width]="width"
      role="dialog"
      [attr.aria-modal]="open"
      [attr.aria-label]="title"
    >
      <div class="drawer__header">
        <h2 class="drawer__title">{{ title }}</h2>
        <ion-button fill="clear" class="drawer__close" (click)="closed.emit()">
          <ion-icon slot="icon-only" name="close-outline" />
        </ion-button>
      </div>

      <div class="drawer__body">
        <ng-content />
      </div>

      <div class="drawer__footer">
        <ng-content select="[slot='footer']" />
      </div>
    </div>
  `,
})
export class DrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() width = '400px';
  @Input() position: 'left' | 'right' = 'right';
  @Output() closed = new EventEmitter<void>();

  constructor() {
    addIcons({ closeOutline });
  }
}
