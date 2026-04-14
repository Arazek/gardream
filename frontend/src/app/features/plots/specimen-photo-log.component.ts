import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonModal, IonDatetime } from '@ionic/angular/standalone';
import { PhotoEntry } from './store/specimens.state';

@Component({
  selector: 'app-specimen-photo-log',
  standalone: true,
  imports: [CommonModule, FormsModule, IonModal, IonDatetime],
  styleUrl: './specimen-photo-log.component.scss',
  template: `
    <div class="photo-log">
      @if (photos.length > 0) {
        <div class="photo-log__grid">
          @for (photo of photos; track photo.url) {
            <div class="photo-log__item">
              <img [src]="photo.url" [alt]="photo.filename" class="photo-log__image" />
              @if (photo.note) {
                <span class="photo-log__note">{{ photo.note }}</span>
              }
              <span class="photo-log__date">{{ formatDate(photo.taken_at) }}</span>
            </div>
          }
        </div>
      }

      <button class="photo-log__add-btn" (click)="openPhotoModal()">
        <span class="material-symbols-outlined">add_a_photo</span>
        Add Photo
      </button>
    </div>

    <ion-modal [isOpen]="isPhotoModalOpen" (didDismiss)="isPhotoModalOpen = false">
      <ng-template>
        <div class="photo-modal">
          <h2>Add Photo</h2>

          <div class="form-group">
            <label>Photo</label>
            <input
              type="file"
              accept="image/*"
              #photoInput
              (change)="onPhotoSelected($event)"
              class="photo-input"
            />
            <button class="browse-btn" (click)="photoInput.click()">
              Choose Photo
            </button>
            @if (selectedPhotoName) {
              <span class="file-name">{{ selectedPhotoName }}</span>
            }
          </div>

          <div class="form-group">
            <label>Date (optional)</label>
            <ion-datetime
              [value]="selectedDate"
              (ionChange)="onDateChange($event)"
              display-format="MMM DD, YYYY"
              placeholder="Select date"
            ></ion-datetime>
          </div>

          <div class="form-group">
            <label>Note (optional)</label>
            <textarea
              [(ngModel)]="selectedNote"
              placeholder="Add a note about this photo..."
              class="note-textarea"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn btn--secondary" (click)="closePhotoModal()">Cancel</button>
            <button
              class="btn btn--primary"
              (click)="submitPhoto()"
              [disabled]="!selectedPhotoFile"
            >
              Add Photo
            </button>
          </div>
        </div>
      </ng-template>
    </ion-modal>
  `,
})
export class SpecimenPhotoLogComponent {
  @Input() photos: PhotoEntry[] = [];
  @Output() photoAdded = new EventEmitter<File>();

  isPhotoModalOpen = false;
  selectedPhotoFile: File | null = null;
  selectedPhotoName: string | null = null;
  selectedDate = new Date().toISOString();
  selectedNote = '';

  openPhotoModal(): void {
    this.isPhotoModalOpen = true;
  }

  closePhotoModal(): void {
    this.isPhotoModalOpen = false;
    this.resetForm();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.selectedPhotoFile = files[0];
      this.selectedPhotoName = files[0].name;
    }
  }

  submitPhoto(): void {
    if (!this.selectedPhotoFile) return;
    this.photoAdded.emit(this.selectedPhotoFile);
    this.closePhotoModal();
  }

  onDateChange(event: any): void {
    this.selectedDate = event.detail.value;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private resetForm(): void {
    this.selectedPhotoFile = null;
    this.selectedPhotoName = null;
    this.selectedDate = new Date().toISOString();
    this.selectedNote = '';
  }
}
