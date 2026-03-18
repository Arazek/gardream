import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { IonContent, IonButton, IonIcon, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  timeOutline,
  gridOutline,
  calendarOutline,
  constructOutline,
  addCircleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  waterOutline,
  sunnyOutline,
} from 'ionicons/icons';

import {
  PageHeaderComponent,
  SectionComponent,
  CardComponent,
  StatCardComponent,
  BadgeComponent,
  EmptyStateComponent,
} from '../../../../shared';

export interface GardenCrop {
  id: string;
  name: string;
  category: 'vegetable' | 'herb' | 'fruit';
  plantedDate: Date;
  daysToHarvest: number;
  color: string;
  planterName: string;
  status: 'growing' | 'ready' | 'overdue';
}

const MOCK_CROPS: GardenCrop[] = [
  {
    id: '1',
    name: 'Cherry Tomatoes',
    category: 'vegetable',
    plantedDate: new Date(Date.now() - 55 * 86400000),
    daysToHarvest: 65,
    color: '#ef4444',
    planterName: 'Raised Bed A',
    status: 'growing',
  },
  {
    id: '2',
    name: 'Basil',
    category: 'herb',
    plantedDate: new Date(Date.now() - 30 * 86400000),
    daysToHarvest: 30,
    color: '#22c55e',
    planterName: 'Raised Bed A',
    status: 'ready',
  },
  {
    id: '3',
    name: 'Carrots',
    category: 'vegetable',
    plantedDate: new Date(Date.now() - 40 * 86400000),
    daysToHarvest: 75,
    color: '#f97316',
    planterName: 'Raised Bed B',
    status: 'growing',
  },
  {
    id: '4',
    name: 'Lettuce',
    category: 'vegetable',
    plantedDate: new Date(Date.now() - 28 * 86400000),
    daysToHarvest: 30,
    color: '#84cc16',
    planterName: 'Raised Bed B',
    status: 'ready',
  },
  {
    id: '5',
    name: 'Mint',
    category: 'herb',
    plantedDate: new Date(Date.now() - 20 * 86400000),
    daysToHarvest: 60,
    color: '#10b981',
    planterName: 'Raised Bed A',
    status: 'growing',
  },
  {
    id: '6',
    name: 'Cucumber',
    category: 'vegetable',
    plantedDate: new Date(Date.now() - 50 * 86400000),
    daysToHarvest: 55,
    color: '#65a30d',
    planterName: 'Raised Bed B',
    status: 'overdue',
  },
];

@Component({
  selector: 'app-garden-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    IonContent,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    PageHeaderComponent,
    SectionComponent,
    CardComponent,
    StatCardComponent,
    BadgeComponent,
    EmptyStateComponent,
  ],
  styleUrl: './garden-dashboard.page.scss',
  template: `
    <app-page-header title="My Garden" />

    <ion-content class="dashboard-content" [fullscreen]="true">

      <!-- Season greeting -->
      <div class="dashboard-hero">
        <p class="dashboard-hero__season">Spring 2026</p>
        <h1 class="dashboard-hero__headline">Your garden is thriving</h1>
        <p class="dashboard-hero__sub">{{ readyCrops.length }} crop{{ readyCrops.length !== 1 ? 's' : '' }} ready to harvest</p>
      </div>

      <!-- Stats overview -->
      <app-section>
        <div class="stats-grid">
          <app-stat-card
            label="Active Crops"
            [value]="totalCrops"
            icon="leaf-outline"
            color="success"
          />
          <app-stat-card
            label="Ready Now"
            [value]="readyCrops.length"
            icon="checkmark-circle-outline"
            color="warning"
          />
          <app-stat-card
            label="Next Harvest"
            [value]="daysToNextHarvest + 'd'"
            icon="time-outline"
            color="primary"
          />
        </div>
      </app-section>

      <!-- Upcoming harvests -->
      <app-section title="Upcoming Harvests">
        @if (upcomingCrops.length === 0) {
          <app-empty-state
            icon="leaf-outline"
            title="No crops planted yet"
            description="Start building your garden to track harvests"
          />
        } @else {
          <div class="harvest-list">
            @for (crop of upcomingCrops; track crop.id) {
              <app-card
                class="harvest-card"
                [clickable]="true"
                (cardClick)="goToCrop(crop.id)"
              >
                <div class="harvest-card__content">
                  <div class="harvest-card__dot" [style.background]="crop.color"></div>
                  <div class="harvest-card__info">
                    <div class="harvest-card__row">
                      <span class="harvest-card__name">{{ crop.name }}</span>
                      <app-badge [variant]="statusVariant(crop.status)">
                        {{ statusLabel(crop.status) }}
                      </app-badge>
                    </div>
                    <span class="harvest-card__meta">
                      <ion-icon name="grid-outline" />
                      {{ crop.planterName }}
                    </span>
                    <div class="harvest-card__progress-wrap">
                      <div class="harvest-card__progress-bar">
                        <div
                          class="harvest-card__progress-fill"
                          [style.width.%]="growthPercent(crop)"
                          [style.background]="crop.color"
                        ></div>
                      </div>
                      <span class="harvest-card__progress-label">
                        {{ daysRemaining(crop) > 0 ? daysRemaining(crop) + 'd left' : 'Ready!' }}
                      </span>
                    </div>
                  </div>
                </div>
              </app-card>
            }
          </div>
        }
      </app-section>

      <!-- Garden breakdown by planter -->
      <app-section title="Garden Layout" seeAllLabel="Open Builder" (seeAll)="goToBuilder()">
        <div class="planter-grid">
          @for (planter of planterSummaries; track planter.name) {
            <app-card class="planter-card" [clickable]="true" (cardClick)="goToBuilder()">
              <div class="planter-card__content">
                <ion-icon class="planter-card__icon" name="grid-outline" />
                <span class="planter-card__name">{{ planter.name }}</span>
                <span class="planter-card__count">{{ planter.count }} crop{{ planter.count !== 1 ? 's' : '' }}</span>
                <div class="planter-card__crops">
                  @for (crop of planter.crops; track crop.id) {
                    <span
                      class="planter-card__dot"
                      [style.background]="crop.color"
                      [title]="crop.name"
                    ></span>
                  }
                </div>
              </div>
            </app-card>
          }
        </div>
      </app-section>

      <!-- Spacer for FAB -->
      <div style="height: 80px;"></div>

    </ion-content>

    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button color="success" (click)="goToBuilder()" aria-label="Open garden builder">
        <ion-icon name="construct-outline" />
      </ion-fab-button>
    </ion-fab>
  `,
})
export class GardenDashboardPage implements OnInit {
  crops: GardenCrop[] = MOCK_CROPS;

  get totalCrops(): number {
    return this.crops.length;
  }

  get readyCrops(): GardenCrop[] {
    return this.crops.filter((c) => c.status === 'ready' || c.status === 'overdue');
  }

  get upcomingCrops(): GardenCrop[] {
    return [...this.crops].sort((a, b) => this.daysRemaining(a) - this.daysRemaining(b));
  }

  get daysToNextHarvest(): number {
    const upcoming = this.crops
      .map((c) => this.daysRemaining(c))
      .filter((d) => d > 0);
    return upcoming.length > 0 ? Math.min(...upcoming) : 0;
  }

  get planterSummaries(): { name: string; count: number; crops: GardenCrop[] }[] {
    const map = new Map<string, GardenCrop[]>();
    for (const crop of this.crops) {
      if (!map.has(crop.planterName)) map.set(crop.planterName, []);
      map.get(crop.planterName)!.push(crop);
    }
    return Array.from(map.entries()).map(([name, crops]) => ({
      name,
      count: crops.length,
      crops,
    }));
  }

  growthPercent(crop: GardenCrop): number {
    const elapsed = (Date.now() - crop.plantedDate.getTime()) / 86400000;
    return Math.min(100, Math.round((elapsed / crop.daysToHarvest) * 100));
  }

  daysRemaining(crop: GardenCrop): number {
    const elapsed = (Date.now() - crop.plantedDate.getTime()) / 86400000;
    return Math.max(0, Math.ceil(crop.daysToHarvest - elapsed));
  }

  statusVariant(status: GardenCrop['status']): 'success' | 'warning' | 'danger' {
    if (status === 'ready') return 'success';
    if (status === 'overdue') return 'danger';
    return 'warning';
  }

  statusLabel(status: GardenCrop['status']): string {
    if (status === 'ready') return 'Ready';
    if (status === 'overdue') return 'Overdue';
    return 'Growing';
  }

  constructor(private router: Router) {
    addIcons({
      leafOutline,
      timeOutline,
      gridOutline,
      calendarOutline,
      constructOutline,
      addCircleOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      waterOutline,
      sunnyOutline,
    });
  }

  ngOnInit(): void {}

  goToBuilder(): void {
    this.router.navigateByUrl('/tabs/garden/builder');
  }

  goToCrop(id: string): void {
    this.router.navigateByUrl(`/tabs/garden/crop/${id}`);
  }
}
