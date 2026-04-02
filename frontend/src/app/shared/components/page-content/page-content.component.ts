import { Component, Input } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

/**
 * PageContentComponent
 *
 * A wrapper around IonContent that automatically handles padding for fixed navbars.
 * This ensures consistent spacing across all pages and eliminates the need to
 * manually calculate navbar heights in each page component.
 *
 * Features:
 * - Automatically accounts for top-app-bar height
 * - Automatically accounts for bottom-nav-bar height (mobile)
 * - Uses design system spacing tokens
 * - Supports custom padding overrides via CSS custom properties
 *
 * Usage:
 * ```html
 * <app-page-content>
 *   <!-- Page content here -->
 * </app-page-content>
 * ```
 *
 * With custom padding:
 * ```html
 * <app-page-content style="--page-padding-start: 2rem;">
 *   <!-- Page content here -->
 * </app-page-content>
 * ```
 */
@Component({
  selector: 'app-page-content',
  standalone: true,
  imports: [IonContent],
  styleUrl: './page-content.component.scss',
  host: { class: 'page-content-host' },
  template: `
    <ion-content class="page-content" [attr.data-component]="'page-content'">
      <ng-content />
    </ion-content>
  `,
})
export class PageContentComponent {
  /**
   * Optional: Custom background color. Defaults to --color-surface
   */
  @Input() background?: string;
}
