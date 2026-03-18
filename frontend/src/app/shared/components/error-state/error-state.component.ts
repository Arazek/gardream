import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [IonIcon, IonButton],
  styleUrl: './error-state.component.scss',
  template: `
    <div class="error-state">
      <ion-icon class="error-state__icon" [name]="icon" />
      <h2 class="error-state__title">{{ title }}</h2>
      <p class="error-state__message">{{ message }}</p>
      @if (retryLabel) {
        <ion-button class="error-state__retry" fill="outline" (click)="retry.emit()">
          {{ retryLabel }}
        </ion-button>
      }
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() icon = 'cloud-offline-outline';
  @Input() title = 'Something went wrong';
  @Input() message = 'Please try again.';
  @Input() retryLabel = 'Try again';
  @Output() retry = new EventEmitter<void>();

  constructor() {
    addIcons({ cloudOfflineOutline });
  }
}
