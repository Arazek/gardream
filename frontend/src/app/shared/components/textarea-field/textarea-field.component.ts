import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonTextarea } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [NgClass, IonTextarea, ReactiveFormsModule],
  styleUrl: './textarea-field.component.scss',
  template: `
    <div class="textarea-field" [ngClass]="{ 'textarea-field--error': hasError }">
      @if (label) {
        <label class="textarea-field__label">{{ label }}
          @if (required) { <span class="textarea-field__required">*</span> }
        </label>
      }
      <div class="textarea-field__wrap">
        <ion-textarea
          class="textarea-field__input"
          [placeholder]="placeholder"
          [rows]="rows"
          [autoGrow]="autoGrow"
          [formControl]="control"
        />
      </div>
      @if (hasError) {
        <p class="textarea-field__error">This field is required.</p>
      }
    </div>
  `,
})
export class TextareaFieldComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() rows = 3;
  @Input() autoGrow = false;
  @Input() required = false;
  @Input() control!: FormControl;

  get hasError(): boolean {
    return !!(this.control?.invalid && this.control?.touched);
  }
}
