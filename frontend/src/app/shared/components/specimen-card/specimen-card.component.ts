import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { StatChipComponent } from '../stat-chip/stat-chip.component';
import { Crop } from '../../../features/crops/store/crops.state';

export type SpecimenCardSize = 'large' | 'compact';

@Component({
  selector: 'app-specimen-card',
  standalone: true,
  imports: [NgClass, StatChipComponent],
  styleUrl: './specimen-card.component.scss',
  template: `
    <div class="specimen-card" [ngClass]="'specimen-card--' + size">
      @if (size === 'large') {
        <div class="specimen-card__image-wrap">
          <img class="specimen-card__image"
            [src]="crop.thumbnail_url || '/assets/placeholder-crop.svg'"
            [alt]="crop.name"
            loading="lazy" />
        </div>
        <div class="specimen-card__body">
          <p class="specimen-card__latin">{{ crop.latin_name }}</p>
          <h3 class="specimen-card__name">{{ crop.name }}</h3>
          <div class="specimen-card__stats">
            <app-stat-chip icon="sunny" label="Sun" [value]="sunLabel" />
            <app-stat-chip icon="calendar_today" label="Harvest" [value]="crop.days_to_harvest + 'd'" />
          </div>
        </div>
      } @else {
        <div class="specimen-card__compact-image">
          <img [src]="crop.thumbnail_url || '/assets/placeholder-crop.svg'" [alt]="crop.name" loading="lazy" />
        </div>
        <div class="specimen-card__body">
          <h3 class="specimen-card__name">{{ crop.name }}</h3>
          <app-stat-chip icon="calendar_today" label="Harvest" [value]="crop.days_to_harvest + 'd'" />
        </div>
      }
    </div>
  `,
})
export class SpecimenCardComponent {
  @Input({ required: true }) crop!: Crop;
  @Input() size: SpecimenCardSize = 'large';

  get sunLabel(): string {
    const map: Record<string, string> = {
      full_sun: 'Full sun',
      partial_shade: 'Partial shade',
      shade: 'Shade',
    };
    return map[this.crop.sun_requirement] ?? this.crop.sun_requirement;
  }
}
