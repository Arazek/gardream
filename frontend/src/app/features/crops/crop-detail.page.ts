import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import { TopAppBarComponent, SpecimenCardComponent, StatChipComponent } from '../../shared';
import { CropsActions } from './store/crops.actions';
import { selectSelectedCrop, selectCropsLoading } from './store/crops.selectors';

@Component({
  selector: 'app-crop-detail',
  standalone: true,
  imports: [AsyncPipe, IonContent, TopAppBarComponent, SpecimenCardComponent, StatChipComponent],
  styleUrl: './crop-detail.page.scss',
  template: `
    <app-top-app-bar [title]="(crop$ | async)?.name ?? 'Crop'">
      <button leading class="icon-btn" aria-label="Back" (click)="goBack()">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
    </app-top-app-bar>

    <ion-content class="crop-detail-content">
      <div class="crop-detail-wrapper">

        @if (loading$ | async) {
          <div class="crop-detail-skeleton">
            <div class="crop-detail-skeleton__image"></div>
            <div class="crop-detail-skeleton__body">
              <div class="crop-detail-skeleton__line"></div>
              <div class="crop-detail-skeleton__line crop-detail-skeleton__line--short"></div>
            </div>
          </div>
        }

        @if (crop$ | async; as crop) {

          <app-specimen-card [crop]="crop" size="large" />

          <div class="crop-detail-body">

          @if (crop.description) {
            <section class="crop-detail-section">
              <h2 class="crop-detail-section__title">About</h2>
              <p class="crop-detail-section__text">{{ crop.description }}</p>
            </section>
          }

          <section class="crop-detail-section">
            <h2 class="crop-detail-section__title">Growing stats</h2>
            <div class="crop-detail-stats">
              <app-stat-chip icon="water_drop" label="Water every" [value]="crop.watering_frequency_days + ' days'" />
              <app-stat-chip icon="science" label="Fertilise every" [value]="crop.fertilise_frequency_days + ' days'" />
              <app-stat-chip icon="schedule" label="Germination" [value]="crop.days_to_germination + ' days'" />
              <app-stat-chip icon="agriculture" label="Harvest in" [value]="crop.days_to_harvest + ' days'" />
              <app-stat-chip icon="straighten" label="Spacing" [value]="crop.spacing_cm + ' cm'" />
              @if (crop.prune_frequency_days) {
                <app-stat-chip icon="content_cut" label="Prune every" [value]="crop.prune_frequency_days + ' days'" />
              }
            </div>
          </section>

          @if (crop.companion_crops.length > 0) {
            <section class="crop-detail-section">
              <h2 class="crop-detail-section__title">Companion plants</h2>
              <div class="crop-detail-chips">
                @for (name of crop.companion_crops; track name) {
                  <span class="crop-detail-chip crop-detail-chip--companion">{{ name }}</span>
                }
              </div>
            </section>
          }

          @if (crop.avoid_crops.length > 0) {
            <section class="crop-detail-section">
              <h2 class="crop-detail-section__title">Avoid planting with</h2>
              <div class="crop-detail-chips">
                @for (name of crop.avoid_crops; track name) {
                  <span class="crop-detail-chip crop-detail-chip--avoid">{{ name }}</span>
                }
              </div>
            </section>
          }

          </div>
        }

      </div>
    </ion-content>
  `,
})
export class CropDetailPage implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly crop$ = this.store.select(selectSelectedCrop);
  readonly loading$ = this.store.select(selectCropsLoading);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(CropsActions.selectCrop({ id }));
      this.store.dispatch(CropsActions.loadCrop({ id }));
    }
  }

  goBack(): void {
    this.router.navigate(['/tabs/library']);
  }

  goToSettings(): void {
    this.router.navigate(['/tabs/settings']);
  }
}
