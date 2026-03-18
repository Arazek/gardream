import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-success-state',
  standalone: true,
  imports: [IonIcon, IonButton],
  styleUrl: './success-state.component.scss',
  template: `
    <div class="success-state">
      <ion-icon class="success-state__icon" [name]="icon" />
      <h2 class="success-state__title">{{ title }}</h2>
      <p class="success-state__message">{{ message }}</p>
      @if (actionLabel) {
        <ion-button class="success-state__action" (click)="action.emit()">
          {{ actionLabel }}
        </ion-button>
      }
    </div>
  `,
})
export class SuccessStateComponent {
  @Input() icon = 'checkmark-circle-outline';
  @Input() title = 'Done!';
  @Input() message = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();

  constructor() {
    addIcons({ checkmarkCircleOutline });
  }
}
