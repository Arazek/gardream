import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  styleUrl: './progress-bar.component.scss',
  template: `
    <div class="progress-bar" [attr.aria-label]="label" role="progressbar"
         [attr.aria-valuenow]="value" aria-valuemin="0" aria-valuemax="100">
      @if (label) {
        <span class="progress-bar__label">{{ label }}</span>
      }
      <div class="progress-bar__track">
        <div class="progress-bar__fill" [style.width.%]="displayValue"></div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent implements OnInit {
  @Input() value = 0;
  @Input() label?: string;

  displayValue = 0;

  ngOnInit() {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      this.displayValue = Math.min(100, Math.max(0, this.value));
    });
  }
}
