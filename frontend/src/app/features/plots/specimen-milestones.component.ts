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
      @if (milestones.length > 0) {
        <div class="milestones__timeline">
          @for (milestone of milestones; track milestone.stage_name) {
            <div class="milestones__item" [class.milestones__item--active]="isActive(milestone)">
              <div class="milestones__dot"></div>
              <div class="milestones__content">
                <h4 class="milestones__stage">{{ milestone.stage_name }}</h4>
                <span class="milestones__day">Expected: day {{ milestone.expected_day }}</span>
                @if (milestone.actual_day !== null && milestone.actual_day !== undefined) {
                  <span class="milestones__actual">Actual: day {{ milestone.actual_day }}</span>
                }
                @if (milestone.notes) {
                  <p class="milestones__notes">{{ milestone.notes }}</p>
                }
              </div>
              @if (!milestone.actual_day) {
                <button
                  class="milestones__record-btn"
                  (click)="recordMilestone(milestone)"
                  title="Record achievement date"
                >
                  Record
                </button>
              }
            </div>
          }
        </div>
      } @else {
        <p class="milestones__empty">No milestones yet</p>
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
  `,
})
export class SpecimenMilestonesComponent {
  @Input() milestones: Milestone[] = [];
  @Input() currentStage: string = '';
  @Output() milestoneAdded = new EventEmitter<Milestone>();

  showAddForm = false;
  newMilestone: Partial<Milestone> = {
    stage_name: '',
    expected_day: undefined,
    notes: '',
  };

  isActive(milestone: Milestone): boolean {
    return milestone.stage_name.toLowerCase() === this.currentStage.toLowerCase();
  }

  recordMilestone(milestone: Milestone): void {
    const today = new Date();
    const updated = { ...milestone, actual_day: Math.floor((today.getTime() - Date.now()) / 86400000) };
    // Note: This needs to be connected to the parent for proper update
    this.milestoneAdded.emit(updated);
  }

  openAddForm(): void {
    this.showAddForm = true;
  }

  cancelAddForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  submitMilestone(): void {
    if (!this.newMilestone.stage_name || this.newMilestone.expected_day === undefined) {
      return;
    }

    const milestone: Milestone = {
      stage_name: this.newMilestone.stage_name,
      expected_day: this.newMilestone.expected_day,
      notes: this.newMilestone.notes,
    };

    this.milestoneAdded.emit(milestone);
    this.cancelAddForm();
  }

  private resetForm(): void {
    this.newMilestone = {
      stage_name: '',
      expected_day: undefined,
      notes: '',
    };
  }
}
