import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline, trendingDownOutline,
  peopleOutline, cashOutline, cartOutline,
  statsChartOutline, alertCircleOutline, checkmarkCircleOutline,
} from 'ionicons/icons';

export type StatCardColor = 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass, IonIcon],
  styleUrl: './stat-card.component.scss',
  template: `
    <div class="stat-card" [ngClass]="'stat-card--' + color">
      <div class="stat-card__top">
        @if (icon) {
          <div class="stat-card__icon-wrap">
            <ion-icon class="stat-card__icon" [name]="icon" />
          </div>
        }
        @if (trend !== undefined && trend !== null) {
          <span
            class="stat-card__trend"
            [ngClass]="trend >= 0 ? 'stat-card__trend--up' : 'stat-card__trend--down'"
          >
            <ion-icon [name]="trend >= 0 ? 'trending-up-outline' : 'trending-down-outline'" />
            {{ absTrend }}%
          </span>
        }
      </div>
      <div class="stat-card__value">{{ value }}</div>
      <div class="stat-card__label">{{ label }}</div>
    </div>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() trend?: number;
  @Input() icon?: string;
  @Input() color: StatCardColor = 'primary';

  get absTrend(): number {
    return this.trend !== undefined ? Math.abs(this.trend) : 0;
  }

  constructor() {
    addIcons({
      trendingUpOutline, trendingDownOutline,
      peopleOutline, cashOutline, cartOutline,
      statsChartOutline, alertCircleOutline, checkmarkCircleOutline,
    });
  }
}
