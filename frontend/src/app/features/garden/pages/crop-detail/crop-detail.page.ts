import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  waterOutline,
  sunnyOutline,
  timeOutline,
  calendarOutline,
  thermometerOutline,
  flowerOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  resizeOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

import {
  PageHeaderComponent,
  SectionComponent,
  CardComponent,
  BadgeComponent,
  BadgeVariant,
} from '../../../../shared';

export interface CropData {
  id: string;
  name: string;
  scientificName: string;
  category: 'vegetable' | 'herb' | 'fruit';
  color: string;
  description: string;
  daysToGerminate: number;
  daysToHarvest: number;
  wateringIntervalDays: number;
  sunlight: 'full' | 'partial' | 'shade';
  spacingCm: number;
  depthCm: number;
  minTempC: number;
  maxTempC: number;
  companionPlants: string[];
  avoidPlants: string[];
  tips: string[];
  plantedDate?: Date;
}

const CROP_DATABASE: CropData[] = [
  {
    id: '1',
    name: 'Cherry Tomatoes',
    scientificName: 'Solanum lycopersicum var. cerasiforme',
    category: 'vegetable',
    color: '#ef4444',
    description:
      'Prolific and sweet, cherry tomatoes are easy to grow and produce abundantly through summer.',
    daysToGerminate: 7,
    daysToHarvest: 65,
    wateringIntervalDays: 2,
    sunlight: 'full',
    spacingCm: 60,
    depthCm: 1,
    minTempC: 18,
    maxTempC: 30,
    companionPlants: ['Basil', 'Carrot', 'Marigold'],
    avoidPlants: ['Fennel', 'Brassicas'],
    tips: [
      'Support with stakes or cages when seedlings reach 30 cm.',
      'Pinch off suckers to improve fruit size and airflow.',
      'Water consistently — irregular watering causes blossom end rot.',
    ],
    plantedDate: new Date(Date.now() - 55 * 86400000),
  },
  {
    id: '2',
    name: 'Basil',
    scientificName: 'Ocimum basilicum',
    category: 'herb',
    color: '#22c55e',
    description:
      'Aromatic herb with intense flavour. Thrives in warm, sunny spots and pairs perfectly with tomatoes.',
    daysToGerminate: 5,
    daysToHarvest: 30,
    wateringIntervalDays: 1,
    sunlight: 'full',
    spacingCm: 20,
    depthCm: 0.5,
    minTempC: 16,
    maxTempC: 35,
    companionPlants: ['Tomato', 'Pepper', 'Oregano'],
    avoidPlants: ['Sage', 'Thyme'],
    tips: [
      'Pinch flowers as soon as they appear to extend leaf production.',
      'Harvest in the morning when essential oils are most concentrated.',
      'Protect from cold — basil is very frost-sensitive.',
    ],
    plantedDate: new Date(Date.now() - 30 * 86400000),
  },
  {
    id: '3',
    name: 'Carrots',
    scientificName: 'Daucus carota subsp. sativus',
    category: 'vegetable',
    color: '#f97316',
    description:
      'Root vegetable that thrives in loose, sandy soil. Patience is key — they develop underground and reward with sweetness.',
    daysToGerminate: 14,
    daysToHarvest: 75,
    wateringIntervalDays: 3,
    sunlight: 'full',
    spacingCm: 5,
    depthCm: 1,
    minTempC: 10,
    maxTempC: 24,
    companionPlants: ['Tomato', 'Lettuce', 'Onion'],
    avoidPlants: ['Dill', 'Parsnip'],
    tips: [
      'Loosen soil to at least 30 cm deep before planting to avoid forked roots.',
      'Thin seedlings to 5 cm apart once they reach 5 cm tall.',
      'Avoid nitrogen-heavy fertilisers — they promote leafy growth over root development.',
    ],
    plantedDate: new Date(Date.now() - 40 * 86400000),
  },
  {
    id: '4',
    name: 'Lettuce',
    scientificName: 'Lactuca sativa',
    category: 'vegetable',
    color: '#84cc16',
    description:
      'Fast-growing leafy green that prefers cooler weather. Harvest outer leaves continuously for weeks of production.',
    daysToGerminate: 7,
    daysToHarvest: 30,
    wateringIntervalDays: 1,
    sunlight: 'partial',
    spacingCm: 25,
    depthCm: 0.3,
    minTempC: 7,
    maxTempC: 22,
    companionPlants: ['Carrot', 'Radish', 'Strawberry'],
    avoidPlants: ['Celery', 'Fennel'],
    tips: [
      'Provide shade cloth in summer to prevent bolting.',
      'Use the cut-and-come-again method — harvest outer leaves, leave the centre.',
      'Sow every 2–3 weeks for a continuous supply.',
    ],
    plantedDate: new Date(Date.now() - 28 * 86400000),
  },
  {
    id: '5',
    name: 'Mint',
    scientificName: 'Mentha × piperita',
    category: 'herb',
    color: '#10b981',
    description:
      'Vigorous and aromatic, mint spreads readily. Grow in containers to control its spread and enjoy year-round harvests.',
    daysToGerminate: 10,
    daysToHarvest: 60,
    wateringIntervalDays: 2,
    sunlight: 'partial',
    spacingCm: 30,
    depthCm: 0.5,
    minTempC: 5,
    maxTempC: 28,
    companionPlants: ['Tomato', 'Pea', 'Cabbage'],
    avoidPlants: ['Chamomile', 'Parsley'],
    tips: [
      'Plant in a pot sunk into the ground to contain spreading roots.',
      'Cut back hard after flowering to encourage fresh leaf growth.',
      'Keep soil consistently moist but not waterlogged.',
    ],
    plantedDate: new Date(Date.now() - 20 * 86400000),
  },
  {
    id: '6',
    name: 'Cucumber',
    scientificName: 'Cucumis sativus',
    category: 'vegetable',
    color: '#65a30d',
    description:
      'Vigorous climber producing crisp, refreshing fruits all summer. Consistent warmth and watering are essential.',
    daysToGerminate: 7,
    daysToHarvest: 55,
    wateringIntervalDays: 1,
    sunlight: 'full',
    spacingCm: 45,
    depthCm: 1,
    minTempC: 20,
    maxTempC: 32,
    companionPlants: ['Radish', 'Sunflower', 'Pea'],
    avoidPlants: ['Sage', 'Potato'],
    tips: [
      'Train vines up a trellis to improve airflow and fruit quality.',
      'Harvest fruits when 15–20 cm long — leaving them on too long reduces yield.',
      'Water at the base to prevent leaf diseases.',
    ],
    plantedDate: new Date(Date.now() - 50 * 86400000),
  },
  {
    id: '7', name: 'Pepper', scientificName: 'Capsicum annuum', category: 'vegetable', color: '#f59e0b',
    description: 'Heat-loving plant producing sweet or spicy fruits. Requires a long warm season to produce well.',
    daysToGerminate: 14, daysToHarvest: 80, wateringIntervalDays: 2, sunlight: 'full',
    spacingCm: 45, depthCm: 0.5, minTempC: 20, maxTempC: 32,
    companionPlants: ['Basil', 'Tomato', 'Carrot'], avoidPlants: ['Fennel', 'Apricot'],
    tips: ['Start seeds indoors 8 weeks before last frost.', 'Mulch to retain soil moisture.'],
  },
  {
    id: '8', name: 'Spinach', scientificName: 'Spinacia oleracea', category: 'vegetable', color: '#16a34a',
    description: 'Nutrient-dense leafy green that bolts quickly in heat. Best grown in spring and autumn.',
    daysToGerminate: 7, daysToHarvest: 40, wateringIntervalDays: 2, sunlight: 'partial',
    spacingCm: 15, depthCm: 1, minTempC: 4, maxTempC: 20,
    companionPlants: ['Strawberry', 'Pea', 'Radish'], avoidPlants: ['Potato', 'Fennel'],
    tips: ['Harvest outer leaves to encourage continued production.', 'Direct sow in cool weather.'],
  },
  {
    id: '9', name: 'Rosemary', scientificName: 'Salvia rosmarinus', category: 'herb', color: '#6d28d9',
    description: 'Woody, drought-tolerant Mediterranean herb with intense aromatic flavour. A garden staple.',
    daysToGerminate: 21, daysToHarvest: 90, wateringIntervalDays: 7, sunlight: 'full',
    spacingCm: 60, depthCm: 0.5, minTempC: -10, maxTempC: 35,
    companionPlants: ['Sage', 'Cabbage', 'Carrot'], avoidPlants: ['Mint', 'Basil'],
    tips: ['Plant in well-drained soil — rosemary hates wet roots.', 'Prune after flowering to keep bushy.'],
  },
  {
    id: '10', name: 'Strawberry', scientificName: 'Fragaria × ananassa', category: 'fruit', color: '#e11d48',
    description: 'Popular garden fruit producing sweet berries. Spreads via runners and returns each year.',
    daysToGerminate: 14, daysToHarvest: 60, wateringIntervalDays: 2, sunlight: 'full',
    spacingCm: 30, depthCm: 1, minTempC: 5, maxTempC: 26,
    companionPlants: ['Lettuce', 'Spinach', 'Thyme'], avoidPlants: ['Fennel', 'Brassicas'],
    tips: ['Use straw mulch to keep berries clean and retain moisture.', 'Remove runners to focus energy on fruit.'],
  },
];

@Component({
  selector: 'app-crop-detail',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    IonContent,
    IonIcon,
    PageHeaderComponent,
    SectionComponent,
    CardComponent,
    BadgeComponent,
  ],
  styleUrl: './crop-detail.page.scss',
  template: `
    @if (crop) {
      <app-page-header
        [title]="crop.name"
        [showBack]="true"
        backHref="/tabs/garden"
      />

      <ion-content class="crop-content">

        <!-- Hero -->
        <div class="crop-hero" [style.border-color]="crop.color + '44'">
          <div class="crop-hero__accent" [style.background]="crop.color + '18'">
            <div class="crop-hero__icon-wrap" [style.background]="crop.color + '22'">
              <ion-icon class="crop-hero__icon" name="leaf-outline" [style.color]="crop.color" />
            </div>
          </div>
          <div class="crop-hero__body">
            <div class="crop-hero__top">
              <div>
                <h2 class="crop-hero__name">{{ crop.name }}</h2>
                <p class="crop-hero__scientific">{{ crop.scientificName }}</p>
              </div>
              <app-badge [variant]="categoryVariant(crop.category)">
                {{ crop.category }}
              </app-badge>
            </div>
            <p class="crop-hero__desc">{{ crop.description }}</p>

            @if (crop.plantedDate) {
              <!-- Growth progress -->
              <div class="growth-progress">
                <div class="growth-progress__labels">
                  <span>Planted {{ crop.plantedDate | date:'d MMM' }}</span>
                  <span class="growth-progress__pct">{{ growthPercent }}%</span>
                  <span>{{ expectedHarvestDate | date:'d MMM' }}</span>
                </div>
                <div class="growth-progress__track">
                  <div
                    class="growth-progress__fill"
                    [style.width.%]="growthPercent"
                    [style.background]="crop.color"
                  ></div>
                  <div
                    class="growth-progress__marker"
                    [style.left.%]="growthPercent"
                    [style.border-color]="crop.color"
                  ></div>
                </div>
                <div class="growth-progress__stage">
                  <ion-icon [name]="stageIcon" [style.color]="crop.color" />
                  <span>{{ stageName }}</span>
                  @if (daysRemaining > 0) {
                    <span class="growth-progress__remaining">{{ daysRemaining }} days to harvest</span>
                  } @else {
                    <span class="growth-progress__ready">Ready to harvest!</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Technical stats -->
        <app-section title="Growing Info">
          <div class="tech-grid">
            <app-card class="tech-card">
              <div class="tech-card__content">
                <ion-icon class="tech-card__icon tech-card__icon--time" name="time-outline" />
                <span class="tech-card__value">{{ crop.daysToGerminate }}d</span>
                <span class="tech-card__label">Germination</span>
              </div>
            </app-card>
            <app-card class="tech-card">
              <div class="tech-card__content">
                <ion-icon class="tech-card__icon tech-card__icon--harvest" name="calendar-outline" />
                <span class="tech-card__value">{{ crop.daysToHarvest }}d</span>
                <span class="tech-card__label">To Harvest</span>
              </div>
            </app-card>
            <app-card class="tech-card">
              <div class="tech-card__content">
                <ion-icon class="tech-card__icon tech-card__icon--water" name="water-outline" />
                <span class="tech-card__value">{{ wateringLabel }}</span>
                <span class="tech-card__label">Watering</span>
              </div>
            </app-card>
            <app-card class="tech-card">
              <div class="tech-card__content">
                <ion-icon class="tech-card__icon tech-card__icon--sun" name="sunny-outline" />
                <span class="tech-card__value">{{ sunlightLabel }}</span>
                <span class="tech-card__label">Sunlight</span>
              </div>
            </app-card>
            <app-card class="tech-card">
              <div class="tech-card__content">
                <ion-icon class="tech-card__icon tech-card__icon--space" name="resize-outline" />
                <span class="tech-card__value">{{ crop.spacingCm }} cm</span>
                <span class="tech-card__label">Spacing</span>
              </div>
            </app-card>
            <app-card class="tech-card">
              <div class="tech-card__content">
                <ion-icon class="tech-card__icon tech-card__icon--temp" name="thermometer-outline" />
                <span class="tech-card__value">{{ crop.minTempC }}–{{ crop.maxTempC }}°C</span>
                <span class="tech-card__label">Temperature</span>
              </div>
            </app-card>
          </div>
        </app-section>

        <!-- Companion planting -->
        <app-section title="Companion Planting">
          <app-card>
            <div class="companion-section">
              <div class="companion-group">
                <div class="companion-group__header companion-group__header--good">
                  <ion-icon name="checkmark-circle-outline" />
                  <span>Plant alongside</span>
                </div>
                <div class="companion-group__chips">
                  @for (plant of crop.companionPlants; track plant) {
                    <span class="companion-chip companion-chip--good">{{ plant }}</span>
                  }
                </div>
              </div>
              <div class="companion-divider"></div>
              <div class="companion-group">
                <div class="companion-group__header companion-group__header--bad">
                  <ion-icon name="alert-circle-outline" />
                  <span>Avoid nearby</span>
                </div>
                <div class="companion-group__chips">
                  @for (plant of crop.avoidPlants; track plant) {
                    <span class="companion-chip companion-chip--bad">{{ plant }}</span>
                  }
                </div>
              </div>
            </div>
          </app-card>
        </app-section>

        <!-- Growing tips -->
        @if (crop.tips.length > 0) {
          <app-section title="Growing Tips">
            <div class="tips-list">
              @for (tip of crop.tips; track $index) {
                <div class="tip-item">
                  <div class="tip-item__num" [style.background]="crop.color">{{ $index + 1 }}</div>
                  <p class="tip-item__text">{{ tip }}</p>
                </div>
              }
            </div>
          </app-section>
        }

        <div style="height: 32px;"></div>

      </ion-content>
    } @else {
      <app-page-header title="Crop Not Found" [showBack]="true" backHref="/tabs/garden" />
      <ion-content>
        <div style="padding: 40px 20px; text-align: center; color: var(--ion-color-medium);">
          <ion-icon name="leaf-outline" style="font-size: 48px; display: block; margin: 0 auto 16px;" />
          <p>Crop data not found.</p>
        </div>
      </ion-content>
    }
  `,
})
export class CropDetailPage implements OnInit {
  crop: CropData | null = null;

  get growthPercent(): number {
    if (!this.crop?.plantedDate) return 0;
    const elapsed = (Date.now() - this.crop.plantedDate.getTime()) / 86400000;
    return Math.min(100, Math.round((elapsed / this.crop.daysToHarvest) * 100));
  }

  get daysRemaining(): number {
    if (!this.crop?.plantedDate) return this.crop?.daysToHarvest ?? 0;
    const elapsed = (Date.now() - this.crop.plantedDate.getTime()) / 86400000;
    return Math.max(0, Math.ceil(this.crop.daysToHarvest - elapsed));
  }

  get expectedHarvestDate(): Date | null {
    if (!this.crop?.plantedDate) return null;
    const d = new Date(this.crop.plantedDate);
    d.setDate(d.getDate() + this.crop.daysToHarvest);
    return d;
  }

  get stageName(): string {
    const pct = this.growthPercent;
    if (pct < 20) return 'Germinating';
    if (pct < 50) return 'Seedling';
    if (pct < 80) return 'Maturing';
    if (pct < 100) return 'Almost ready';
    return 'Ready to harvest';
  }

  get stageIcon(): string {
    const pct = this.growthPercent;
    if (pct < 20) return 'flower-outline';
    if (pct < 80) return 'leaf-outline';
    return 'checkmark-circle-outline';
  }

  get wateringLabel(): string {
    const d = this.crop?.wateringIntervalDays ?? 0;
    if (d === 1) return 'Daily';
    if (d === 7) return 'Weekly';
    return `Every ${d}d`;
  }

  get sunlightLabel(): string {
    const map: Record<string, string> = { full: 'Full sun', partial: 'Partial', shade: 'Shade' };
    return map[this.crop?.sunlight ?? 'full'] ?? 'Unknown';
  }

  categoryVariant(cat: CropData['category']): BadgeVariant {
    if (cat === 'herb') return 'success';
    if (cat === 'fruit') return 'danger';
    return 'primary';
  }

  constructor(private route: ActivatedRoute, private router: Router) {
    addIcons({
      leafOutline,
      waterOutline,
      sunnyOutline,
      timeOutline,
      calendarOutline,
      thermometerOutline,
      flowerOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      informationCircleOutline,
      resizeOutline,
      swapHorizontalOutline,
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.crop = CROP_DATABASE.find((c) => c.id === id) ?? null;
  }
}
