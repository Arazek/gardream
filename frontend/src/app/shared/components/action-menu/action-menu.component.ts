import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonPopover, IonList, IonItem, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline, trashOutline, eyeOutline, copyOutline,
  archiveOutline, shareOutline, flagOutline,
} from 'ionicons/icons';

export interface ActionMenuItem {
  label: string;
  icon?: string;
  color?: 'primary' | 'danger' | 'warning';
  disabled?: boolean;
  handler: () => void;
}

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [NgClass, IonPopover, IonList, IonItem, IonIcon, IonLabel],
  styleUrl: './action-menu.component.scss',
  template: `
    <div class="action-menu">
      <div
        class="action-menu__trigger"
        [id]="triggerId"
        (click)="toggle($event)"
      >
        <ng-content />
      </div>

      <ion-popover
        [trigger]="triggerId"
        [isOpen]="isOpen"
        triggerAction="none"
        [showBackdrop]="false"
        (didDismiss)="isOpen = false"
        size="auto"
      >
        <ng-template>
          <ion-list lines="none" class="action-menu__list">
            @for (action of actions; track action.label) {
              <ion-item
                button
                class="action-menu__item"
                [ngClass]="action.color ? 'action-menu__item--' + action.color : ''"
                [disabled]="action.disabled ?? false"
                (click)="handleAction(action)"
              >
                @if (action.icon) {
                  <ion-icon slot="start" [name]="action.icon" class="action-menu__item-icon" />
                }
                <ion-label>{{ action.label }}</ion-label>
              </ion-item>
            }
          </ion-list>
        </ng-template>
      </ion-popover>
    </div>
  `,
})
export class ActionMenuComponent {
  @Input() actions: ActionMenuItem[] = [];

  isOpen = false;
  readonly triggerId = `action-menu-${Math.random().toString(36).slice(2)}`;

  constructor() {
    addIcons({ createOutline, trashOutline, eyeOutline, copyOutline, archiveOutline, shareOutline, flagOutline });
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  handleAction(action: ActionMenuItem): void {
    this.isOpen = false;
    action.handler();
  }
}
