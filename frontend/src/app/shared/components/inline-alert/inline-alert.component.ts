import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  warningOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

const VARIANT_ICONS: Record<AlertVariant, string> = {
  info: 'information-circle-outline',
  warning: 'warning-outline',
  error: 'close-circle-outline',
  success: 'checkmark-circle-outline',
};

@Component({
  selector: 'app-inline-alert',
  standalone: true,
  imports: [NgClass, IonIcon],
  styleUrl: './inline-alert.component.scss',
  template: `
    <div class="inline-alert" [ngClass]="'inline-alert--' + variant">
      <ion-icon class="inline-alert__icon" [name]="variantIcon" />
      <div class="inline-alert__content">
        @if (title) {
          <strong class="inline-alert__title">{{ title }}</strong>
        }
        <p class="inline-alert__message">{{ message }}</p>
      </div>
    </div>
  `,
})
export class InlineAlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title = '';
  @Input() message = '';

  get variantIcon(): string {
    return VARIANT_ICONS[this.variant];
  }

  constructor() {
    addIcons({ informationCircleOutline, warningOutline, closeCircleOutline, checkmarkCircleOutline });
  }
}
