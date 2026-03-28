import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  styleUrl: './hero-section.component.scss',
  template: `
    <section class="hero-section">
      <div class="hero-section__blob" aria-hidden="true"></div>
      <div class="hero-section__blob hero-section__blob--2" aria-hidden="true"></div>
      @if (subtitle) {
        <p class="hero-section__label">{{ subtitle }}</p>
      }
      @if (statement) {
        <h1 class="hero-section__statement">{{ statement }}</h1>
      } @else {
        <h1 class="hero-section__greeting">{{ greeting }}</h1>
      }
      <div class="hero-section__content">
        <ng-content />
      </div>
    </section>
  `,
})
export class HeroSectionComponent {
  @Input({ required: true }) greeting!: string;
  @Input() subtitle?: string;
  @Input() statement?: string;
}
