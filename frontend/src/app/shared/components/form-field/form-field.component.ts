import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonInput } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [NgClass, IonInput, ReactiveFormsModule],
  styleUrl: './form-field.component.scss',
  template: `
    <div class="form-field" [ngClass]="{ 'form-field--error': hasError }">
      @if (label) {
        <label class="form-field__label">{{ label }}
          @if (required) { <span class="form-field__required">*</span> }
        </label>
      }
      <div class="form-field__input-wrap">
        <ion-input
          class="form-field__input"
          [type]="type"
          [placeholder]="placeholder"
          [formControl]="control"
        />
      </div>
      @if (hasError) {
        <p class="form-field__error">{{ errorMessage }}</p>
      }
    </div>
  `,
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' = 'text';
  @Input() required = false;
  @Input() control!: FormControl;

  get hasError(): boolean {
    return !!(this.control?.invalid && this.control?.touched);
  }

  get errorMessage(): string {
    const errors = this.control?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['email']) return 'Enter a valid email address.';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters.`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters.`;
    return 'Invalid value.';
  }
}
