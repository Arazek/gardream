import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

export type ChipVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [NgClass, IonIcon],
  styleUrl: './chip.component.scss',
  template: `
    <span
      class="chip"
      [ngClass]="['chip--' + variant, selected ? 'chip--selected' : '', removable ? 'chip--removable' : '']"
    >
      <ng-content />
      @if (removable) {
        <ion-icon
          class="chip__remove"
          name="close-outline"
          (click)="remove.emit(); $event.stopPropagation()"
        />
      }
    </span>
  `,
})
export class ChipComponent {
  @Input() variant: ChipVariant = 'default';
  @Input() selected = false;
  @Input() removable = false;
  @Output() remove = new EventEmitter<void>();

  constructor() {
    addIcons({ closeOutline });
  }
}
