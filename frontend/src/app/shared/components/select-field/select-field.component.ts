import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [NgClass, IonSelect, IonSelectOption, ReactiveFormsModule],
  styleUrl: './select-field.component.scss',
  template: `
    <div class="select-field" [ngClass]="{ 'select-field--error': hasError }">
      @if (label) {
        <label class="select-field__label">{{ label }}</label>
      }
      <div class="select-field__wrap">
        <ion-select
          class="select-field__select"
          [placeholder]="placeholder"
          [formControl]="control"
          interface="action-sheet"
        >
          @for (opt of options; track opt.value) {
            <ion-select-option [value]="opt.value">{{ opt.label }}</ion-select-option>
          }
        </ion-select>
      </div>
      @if (hasError) {
        <p class="select-field__error">This field is required.</p>
      }
    </div>
  `,
})
export class SelectFieldComponent {
  @Input() label = '';
  @Input() placeholder = 'Select...';
  @Input() options: SelectOption[] = [];
  @Input() control!: FormControl;

  get hasError(): boolean {
    return !!(this.control?.invalid && this.control?.touched);
  }
}
