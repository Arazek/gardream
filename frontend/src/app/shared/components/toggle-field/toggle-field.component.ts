import { Component, Input } from '@angular/core';
import { IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-toggle-field',
  standalone: true,
  imports: [IonItem, IonLabel, IonToggle, ReactiveFormsModule],
  styleUrl: './toggle-field.component.scss',
  template: `
    <ion-item class="toggle-field" lines="none">
      <ion-label class="toggle-field__label">
        {{ label }}
        @if (description) {
          <p class="toggle-field__description">{{ description }}</p>
        }
      </ion-label>
      <ion-toggle slot="end" [formControl]="control" />
    </ion-item>
  `,
})
export class ToggleFieldComponent {
  @Input() label = '';
  @Input() description = '';
  @Input() control!: FormControl;
}
