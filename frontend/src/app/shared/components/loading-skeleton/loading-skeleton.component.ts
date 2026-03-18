import { Component, Input } from '@angular/core';
import { IonSkeletonText, IonAvatar, IonItem, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [IonSkeletonText, IonAvatar, IonItem, IonLabel],
  styleUrl: './loading-skeleton.component.scss',
  template: `
    <div class="loading-skeleton">
      @for (row of rows; track $index) {
        <ion-item class="loading-skeleton__item" lines="none">
          @if (showAvatar) {
            <ion-avatar slot="start" class="loading-skeleton__avatar">
              <ion-skeleton-text [animated]="true" />
            </ion-avatar>
          }
          <ion-label>
            <ion-skeleton-text [animated]="true" class="loading-skeleton__line--title" />
            <ion-skeleton-text [animated]="true" class="loading-skeleton__line--subtitle" />
          </ion-label>
        </ion-item>
      }
    </div>
  `,
})
export class LoadingSkeletonComponent {
  @Input() count = 4;
  @Input() showAvatar = true;

  get rows(): number[] {
    return Array(this.count).fill(0);
  }
}
