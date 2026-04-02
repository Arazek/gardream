import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { TopAppBarComponent, PageContentComponent, PageBodyWrapperComponent } from '../../shared';
import { SpecimensActions } from './store/specimens.actions';
import { selectSpecimenBySlotId, selectSpecimensLoading, selectSpecimensError } from './store/specimens.selectors';
import { Specimen } from './store/specimens.state';
import { SpecimenPhotoLogComponent } from './specimen-photo-log.component';
import { SpecimenMilestonesComponent } from './specimen-milestones.component';

@Component({
  selector: 'app-specimen-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    IonButton,
    TopAppBarComponent,
    PageContentComponent,
    PageBodyWrapperComponent,
    SpecimenPhotoLogComponent,
    SpecimenMilestonesComponent,
  ],
  styleUrl: './specimen-detail.page.scss',
  template: `
    <app-top-app-bar [title]="(specimen$ | async)?.current_stage ?? 'Specimen'">
      <button leading class="icon-btn" aria-label="Back" (click)="goBack()">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
    </app-top-app-bar>

    <app-page-content class="specimen-detail-content">
      <app-page-body-wrapper>
        @if (specimen$ | async; as specimen) {
          <div class="specimen-container">
          <!-- Progress Section -->
          <div class="progress-section">
            <div class="progress-header">
              <h2>{{ specimen.current_stage }}</h2>
              <span class="progress-label">{{ specimen.progress_pct }}%</span>
            </div>
            <progress class="progress-bar" [value]="specimen.progress_pct" max="100"></progress>
          </div>

          <!-- Stage Override Section -->
          <div class="stage-override-section">
            <h3>Stage</h3>
            <div class="stage-override">
              @if (specimen.stage_override) {
                <span class="stage-chip stage-chip--override">
                  {{ specimen.stage_override }}
                  <button class="clear-btn" (click)="clearStageOverride(specimen)">×</button>
                </span>
              } @else {
                <span class="stage-chip">{{ specimen.current_stage }}</span>
              }
            </div>
          </div>

          <!-- Notes Section -->
          <div class="notes-section">
            <h3>Notes</h3>
            <textarea
              class="notes-textarea"
              placeholder="Add notes about this plant..."
              [value]="specimen.notes ?? ''"
              (blur)="updateNotes(specimen, $event)"
            ></textarea>
          </div>

          <!-- Photo Log Section -->
          <div class="photo-section">
            <h3>Photos</h3>
            <app-specimen-photo-log
              [photos]="specimen.photo_log"
              (photoAdded)="onPhotoAdded(specimen, $event)"
            />
          </div>

          <!-- Milestones Section -->
          <div class="milestones-section">
            <h3>Growth Milestones</h3>
            <app-specimen-milestones
              [milestones]="specimen.milestones"
              [currentStage]="specimen.current_stage"
              (milestoneAdded)="onMilestoneAdded(specimen, $event)"
            />
          </div>
        </div>
        } @else {
          @if (loading$ | async) {
            <div class="loading">Loading specimen...</div>
          } @else {
            <div class="error">{{ error$ | async }}</div>
          }
        }
      </app-page-body-wrapper>
    </app-page-content>
  `,
})
export class SpecimenDetailPage implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  specimen$: Observable<Specimen | undefined> = new Observable();
  loading$ = this.store.select(selectSpecimensLoading);
  error$ = this.store.select(selectSpecimensError);

  ngOnInit(): void {
    const plotId = this.route.snapshot.paramMap.get('id');
    const slotId = this.route.snapshot.paramMap.get('slotId');

    if (plotId && slotId) {
      this.specimen$ = this.store.select(selectSpecimenBySlotId(slotId));
      this.store.dispatch(SpecimensActions.loadSpecimen({ plotId, slotId }));
    }
  }

  updateNotes(specimen: Specimen, event: Event): void {
    const plotId = this.route.snapshot.paramMap.get('id');
    const slotId = this.route.snapshot.paramMap.get('slotId');
    if (!plotId || !slotId) return;

    const notes = (event.target as HTMLTextAreaElement).value;
    if (notes === specimen.notes) return;

    this.store.dispatch(
      SpecimensActions.updateSpecimen({
        plotId,
        slotId,
        payload: { notes },
      })
    );
  }

  clearStageOverride(specimen: Specimen): void {
    const plotId = this.route.snapshot.paramMap.get('id');
    const slotId = this.route.snapshot.paramMap.get('slotId');
    if (!plotId || !slotId) return;

    this.store.dispatch(
      SpecimensActions.updateSpecimen({
        plotId,
        slotId,
        payload: { stage_override: null },
      })
    );
  }

  onPhotoAdded(specimen: Specimen, file: File): void {
    const plotId = this.route.snapshot.paramMap.get('id');
    const slotId = this.route.snapshot.paramMap.get('slotId');
    if (!plotId || !slotId) return;

    const today = new Date().toISOString().slice(0, 10);
    this.store.dispatch(
      SpecimensActions.uploadPhoto({
        plotId,
        slotId,
        file,
        takenAt: today,
      })
    );
  }

  onMilestoneAdded(specimen: Specimen, milestone: any): void {
    const plotId = this.route.snapshot.paramMap.get('id');
    const slotId = this.route.snapshot.paramMap.get('slotId');
    if (!plotId || !slotId) return;

    const milestones = [...specimen.milestones, milestone];
    this.store.dispatch(
      SpecimensActions.updateSpecimen({
        plotId,
        slotId,
        payload: { milestones },
      })
    );
  }

  goBack(): void {
    this.router.navigate(['/tabs/plots', this.route.snapshot.paramMap.get('id')]);
  }
}
