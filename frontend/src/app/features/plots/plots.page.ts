import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonRippleEffect } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import { TopAppBarComponent, IconContainerComponent } from '../../shared';
import { PlotsActions } from './store/plots.actions';
import { selectAllPlots, selectPlotsLoading } from './store/plots.selectors';
import { Plot, PlotType } from './store/plots.state';

const PLOT_TYPE_ICON: Record<PlotType, string> = {
  ground_bed: 'yard',
  raised_bed: 'crop_square',
  container: 'local_florist',
  vertical: 'view_week',
};

const PLOT_TYPE_LABEL: Record<PlotType, string> = {
  ground_bed: 'Ground bed',
  raised_bed: 'Raised bed',
  container: 'Container',
  vertical: 'Vertical',
};

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Component({
  selector: 'app-plots',
  standalone: true,
  imports: [AsyncPipe, IonContent, IonRippleEffect, TopAppBarComponent, IconContainerComponent],
  styleUrl: './plots.page.scss',
  template: `
    <app-top-app-bar title="My Plots">
      <button trailing class="icon-btn" aria-label="Add plot" (click)="addPlot()">
        <span class="material-symbols-outlined">add</span>
      </button>
      <button trailing class="icon-btn" aria-label="Profile" (click)="goToSettings()">
        <span class="material-symbols-outlined">person</span>
      </button>
    </app-top-app-bar>

    <ion-content class="plots-content">

      @if (loading$ | async) {
        <div class="plots-list">
          @for (i of [1, 2, 3]; track i) {
            <div class="plots-card plots-card--skeleton"></div>
          }
        </div>
      } @else if ((plots$ | async)?.length === 0) {
        <div class="plots-empty">
          <app-icon-container icon="yard" size="2xl" variant="surface" />
          <h2 class="plots-empty__title">No plots yet</h2>
          <p class="plots-empty__text">Create your first garden bed to get started.</p>
          <button class="plots-empty__cta" (click)="addPlot()">
            <span class="material-symbols-outlined">add</span>
            Add plot
          </button>
        </div>
      } @else {
        <div class="plots-list">
          @for (plot of plots$ | async; track plot.id) {
            <button
              type="button"
              class="plots-card ion-activatable"
              (click)="openPlot(plot.id)"
            >
              <ion-ripple-effect />
              <div class="plots-card__header">
                <app-icon-container [icon]="plotIcon(plot.plot_type)" size="lg" variant="primary" />
                <div class="plots-card__meta">
                  <p class="plots-card__name">{{ plot.name }}</p>
                  <p class="plots-card__type">{{ plotLabel(plot.plot_type) }} · {{ plot.rows }}×{{ plot.cols }}</p>
                </div>
                <span class="material-symbols-outlined plots-card__chevron">chevron_right</span>
              </div>
              <div class="plots-card__footer">
                <span class="plots-card__info">
                  <span class="material-symbols-outlined">eco</span>
                  {{ plot.crop_count }} crop{{ plot.crop_count !== 1 ? 's' : '' }}
                </span>
                <span class="plots-card__info">
                  <span class="material-symbols-outlined">water_drop</span>
                  {{ wateringLabel(plot.watering_days) }}
                </span>
                @if (plot.substrate) {
                  <span class="plots-card__info">
                    <span class="material-symbols-outlined">grass</span>
                    {{ plot.substrate }}
                  </span>
                }
              </div>
            </button>
          }
        </div>
      }

    </ion-content>
  `,
})
export class PlotsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly plots$ = this.store.select(selectAllPlots);
  readonly loading$ = this.store.select(selectPlotsLoading);

  ngOnInit(): void {
    this.store.dispatch(PlotsActions.loadPlots());
  }

  plotIcon(type: PlotType): string { return PLOT_TYPE_ICON[type] ?? 'yard'; }
  plotLabel(type: PlotType): string { return PLOT_TYPE_LABEL[type] ?? type; }
  wateringLabel(days: number[]): string {
    if (!days.length) return 'No schedule';
    return days.map(d => DAY_SHORT[d]).join(', ');
  }

  openPlot(id: string): void {
    this.store.dispatch(PlotsActions.selectPlot({ id }));
    this.router.navigate(['/tabs/plots', id]);
  }

  addPlot(): void {
    this.router.navigate(['/tabs/plots/new']);
  }

  goToSettings(): void {
    this.router.navigate(['/tabs/settings']);
  }
}
