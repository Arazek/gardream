import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Milestone } from './store/specimens.state';

@Component({
  selector: 'app-specimen-milestones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './specimen-milestones.component.scss',
  template: `
    <div class="milestones">

      <!-- System growth stages -->
      @if (cropDaysToGermination > 0 || cropDaysToHarvest > 0) {
        <div class="system-milestones">
          <h3 class="milestones__section-title">Growth Stages</h3>
          <div class="milestones__timeline">
            @for (m of systemMilestones; track m.stage_name) {
              <div class="milestones__item" [class.milestones__item--active]="isActive(m)" [class.milestones__item--reached]="m.actual_day !== undefined && m.actual_day !== null">
                <div class="milestones__dot"></div>
                <div class="milestones__content">
                  <h4 class="milestones__stage">{{ m.stage_name }}</h4>
                  <span class="milestones__day">day {{ m.expected_day }}</span>
                  @if (m.actual_day !== null && m.actual_day !== undefined) {
                    <span class="milestones__actual">Reached day {{ m.actual_day }}</span>
                  }
                </div>
                @if (m.actual_day === null || m.actual_day === undefined) {
                  <button
                    class="milestones__mark-btn"
                    [disabled]="!sowDate"
                    (click)="markReached(m)"
                    title="Mark as reached today"
                  >Mark reached</button>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Custom milestones -->
      <div class="custom-milestones">
        <h3 class="milestones__section-title">Custom Milestones</h3>
        @if (milestones.length > 0) {
          <div class="milestones__timeline">
            @for (milestone of milestones; track milestone.stage_name) {
              <div class="milestones__item" [class.milestones__item--active]="isActive(milestone)" [class.milestones__item--reached]="milestone.actual_day !== undefined && milestone.actual_day !== null">
                <div class="milestones__dot"></div>
                <div class="milestones__content">
                  <h4 class="milestones__stage">{{ milestone.stage_name }}</h4>
                  <span class="milestones__day">Expected: day {{ milestone.expected_day }}</span>
                  @if (milestone.actual_day !== null && milestone.actual_day !== undefined) {
                    <span class="milestones__actual">Reached day {{ milestone.actual_day }}</span>
                  }
                  @if (milestone.notes) {
                    <p class="milestones__notes">{{ milestone.notes }}</p>
                  }
                </div>
                @if (!milestone.actual_day) {
                  <button
                    class="milestones__mark-btn"
                    [disabled]="!sowDate"
                    (click)="markReached(milestone)"
                    title="Mark as reached today"
                  >Mark reached</button>
                }
              </div>
            }
          </div>
        } @else {
          <p class="milestones__empty">No custom milestones yet.</p>
        }

        <button class="milestones__add-btn" (click)="openAddForm()">
          <span class="material-symbols-outlined">add</span>
          Add Milestone
        </button>

        @if (showAddForm) {
          <div class="milestone-form">
            <input
              type="text"
              [(ngModel)]="newMilestone.stage_name"
              placeholder="Stage name (e.g., Flowering)"
              class="form-input"
            />
            <input
              type="number"
              [(ngModel)]="newMilestone.expected_day"
              placeholder="Expected day"
              class="form-input"
              min="0"
            />
            <textarea
              [(ngModel)]="newMilestone.notes"
              placeholder="Notes (optional)"
              class="form-textarea"
            ></textarea>
            <div class="form-actions">
              <button class="btn btn--secondary" (click)="cancelAddForm()">Cancel</button>
              <button class="btn btn--primary" (click)="submitMilestone()">Add</button>
            </div>
          </div>
        }
      </div>

    </div>
  `,
})
export class SpecimenMilestonesComponent {
  @Input() milestones: Milestone[] = [];
  @Input() currentStage: string = '';
  @Input() sowDate: string = '';
  @Input() cropDaysToGermination: number = 0;
  @Input() cropDaysToHarvest: number = 0;

  @Output() milestoneAdded = new EventEmitter<Milestone>();
  @Output() milestoneReached = new EventEmitter<Milestone>();

  showAddForm = false;
  newMilestone: Partial<Milestone> = {
    stage_name: '',
    expected_day: undefined,
    notes: '',
  };

  get systemMilestones(): Milestone[] {
    const g = this.cropDaysToGermination;
    const h = this.cropDaysToHarvest;
    const defs: Milestone[] = [
      { stage_name: 'germinating',   expected_day: 0 },
      { stage_name: 'seedling',      expected_day: g },
      { stage_name: 'vegetative',    expected_day: g * 2 },
      { stage_name: 'flowering',     expected_day: Math.round(h * 0.5) },
      { stage_name: 'harvest-ready', expected_day: Math.round(h * 0.8) },
    ];
    return defs.map(def => {
      const recorded = this.milestones.find(m => m.stage_name === def.stage_name);
      return { ...def, actual_day: recorded?.actual_day };
    });
  }

  isActive(milestone: Milestone): boolean {
    return milestone.stage_name.toLowerCase() === this.currentStage.toLowerCase();
  }

  markReached(milestone: Milestone): void {
    if (!this.sowDate) return;
    const sow = new Date(this.sowDate + 'T00:00:00');
    const actual_day = Math.floor((Date.now() - sow.getTime()) / 86_400_000);
    this.milestoneReached.emit({ ...milestone, actual_day });
  }

  openAddForm(): void {
    this.showAddForm = true;
  }

  cancelAddForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  submitMilestone(): void {
    if (!this.newMilestone.stage_name || this.newMilestone.expected_day === undefined) return;
    const milestone: Milestone = {
      stage_name: this.newMilestone.stage_name,
      expected_day: this.newMilestone.expected_day,
      notes: this.newMilestone.notes,
    };
    this.milestoneAdded.emit(milestone);
    this.cancelAddForm();
  }

  private resetForm(): void {
    this.newMilestone = { stage_name: '', expected_day: undefined, notes: '' };
  }
}
