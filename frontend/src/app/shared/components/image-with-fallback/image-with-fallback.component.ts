import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonSkeletonText, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';

@Component({
  selector: 'app-image-with-fallback',
  standalone: true,
  imports: [NgClass, IonSkeletonText, IonIcon],
  styleUrl: './image-with-fallback.component.scss',
  template: `
    <div class="img-fallback" [ngClass]="'img-fallback--' + fit">
      @if (loading) {
        <ion-skeleton-text [animated]="true" class="img-fallback__skeleton" />
      }
      @if (!error) {
        <img
          class="img-fallback__img"
          [ngClass]="{ 'img-fallback__img--hidden': loading }"
          [src]="src"
          [alt]="alt"
          (load)="loading = false"
          (error)="onError()"
        />
      }
      @if (error) {
        <div class="img-fallback__error">
          <ion-icon name="image-outline" />
        </div>
      }
    </div>
  `,
})
export class ImageWithFallbackComponent {
  @Input() src = '';
  @Input() alt = '';
  @Input() fit: 'cover' | 'contain' = 'cover';

  loading = true;
  error = false;

  onError(): void {
    this.loading = false;
    this.error = true;
  }

  constructor() {
    addIcons({ imageOutline });
  }
}
