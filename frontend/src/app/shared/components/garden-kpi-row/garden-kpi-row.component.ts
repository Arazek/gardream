import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NextHarvest {
  daysLeft: number;
  cropName: string;
}

@Component({
  selector: 'app-garden-kpi-row',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './garden-kpi-row.component.scss',
  template: `
    @if (loading) {
      <div class="kpi-row">
        @for (i of [1,2,3,4]; track i) {
          <div class="kpi-card kpi-card--skeleton"></div>
        }
      </div>
    } @else {
      <div class="kpi-row">

        <!-- Near harvest -->
        <div class="kpi-card kpi-card--harvest">
          <span class="material-symbols-outlined kpi-card__icon">potted_plant</span>
          <span class="kpi-card__value">{{ nearHarvestCount }}</span>
          <span class="kpi-card__label">Near harvest</span>
          <span class="kpi-card__sub">≤ 14 days</span>
        </div>

        <!-- Avg progress -->
        <div class="kpi-card kpi-card--progress">
          <span class="material-symbols-outlined kpi-card__icon">show_chart</span>
          <span class="kpi-card__value">{{ avgProgress }}%</span>
          <span class="kpi-card__label">Avg progress</span>
          <div class="kpi-card__bar">
            <div class="kpi-card__bar-fill" [style.width.%]="avgProgress"></div>
          </div>
        </div>

        <!-- Overdue tasks -->
        <div class="kpi-card" [class.kpi-card--overdue]="overdueCount > 0">
          <span class="material-symbols-outlined kpi-card__icon">{{ overdueCount > 0 ? 'warning' : 'check_circle' }}</span>
          <span class="kpi-card__value">{{ overdueCount }}</span>
          <span class="kpi-card__label">Overdue</span>
          <span class="kpi-card__sub">{{ overdueCount === 0 ? 'All on track' : 'tasks' }}</span>
        </div>

        <!-- Next harvest -->
        <div class="kpi-card kpi-card--next">
          <span class="material-symbols-outlined kpi-card__icon">calendar_today</span>
          @if (nextHarvest) {
            <span class="kpi-card__value">{{ nextHarvest.daysLeft }}d</span>
            <span class="kpi-card__label">Next harvest</span>
            <span class="kpi-card__sub">{{ nextHarvest.cropName }}</span>
          } @else {
            <span class="kpi-card__value">—</span>
            <span class="kpi-card__label">Next harvest</span>
            <span class="kpi-card__sub">None upcoming</span>
          }
        </div>

      </div>
    }
  `,
})
export class GardenKpiRowComponent {
  @Input() loading: boolean = false;
  @Input() nearHarvestCount: number = 0;
  @Input() avgProgress: number = 0;
  @Input() overdueCount: number = 0;
  @Input() nextHarvest: NextHarvest | null = null;
}
