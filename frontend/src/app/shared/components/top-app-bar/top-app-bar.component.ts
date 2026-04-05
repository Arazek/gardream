import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export interface NavAction {
  /** Stable identifier — emitted by (actionClick). Must be unique within a bar. */
  id: string;
  /** Material Symbols Outlined ligature, e.g. 'person', 'add', 'notifications'. */
  icon: string;
  /** Accessible label for the button. Always required. */
  label: string;
  /** When true the button is removed from the DOM. Default: false. */
  hidden?: boolean;
  /** When true aria-disabled is set and pointer-events are suppressed. Default: false. */
  disabled?: boolean;
}

@Component({
  selector: 'app-top-app-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './top-app-bar.component.scss',
  template: `
    <header class="top-app-bar">
      <div class="top-app-bar__leading">
        <ng-content select="[leading]" />
      </div>
      @if (title) {
        <span class="top-app-bar__title">{{ title }}</span>
      }
      <div class="top-app-bar__trailing">
        @for (action of actions; track action.id) {
          @if (!action.hidden) {
            <button
              type="button"
              class="top-app-bar__action-btn"
              [attr.aria-label]="action.label"
              [attr.aria-disabled]="action.disabled || null"
              [class.top-app-bar__action-btn--disabled]="action.disabled"
              (click)="!action.disabled && actionClick.emit(action.id)"
            >
              <span class="material-symbols-outlined">{{ action.icon }}</span>
            </button>
          }
        }
        <ng-content select="[trailing]" />
      </div>
    </header>
  `,
})
export class TopAppBarComponent {
  @Input() title?: string;

  /**
   * Declarative trailing action buttons rendered by the component.
   * Rendered before any [trailing] projected content.
   */
  @Input() actions: NavAction[] = [];

  /** Emits the `id` of the NavAction whose button was clicked. */
  @Output() readonly actionClick = new EventEmitter<string>();
}
