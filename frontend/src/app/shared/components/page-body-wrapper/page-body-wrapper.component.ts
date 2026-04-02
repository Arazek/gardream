import { Component } from '@angular/core';

/**
 * PageBodyWrapperComponent
 *
 * A utility wrapper that provides consistent horizontal padding for page content.
 * Used alongside PageContentComponent to create a layout where:
 * - Full-width sections (hero, banners) are direct children of page-content
 * - Regular content is wrapped in this component for horizontal padding
 *
 * Usage:
 * ```html
 * <app-page-content>
 *   <app-hero-section /> <!-- Full width -->
 *   <app-page-body-wrapper>
 *     <!-- Content with horizontal padding -->
 *   </app-page-body-wrapper>
 * </app-page-content>
 * ```
 */
@Component({
  selector: 'app-page-body-wrapper',
  standalone: true,
  styleUrl: './page-body-wrapper.component.scss',
  template: `<ng-content />`,
  host: {
    '[style.display]': '"block"',
    '[style.padding-left]': "'var(--page-body-padding-start, var(--space-4))'",
    '[style.padding-right]': "'var(--page-body-padding-end, var(--space-4))'",
  },
})
export class PageBodyWrapperComponent {}
