import { Component } from '@angular/core';

@Component({
  selector: 'app-chip-list',
  standalone: true,
  styleUrl: './chip-list.component.scss',
  template: `<div class="chip-list"><ng-content /></div>`,
})
export class ChipListComponent {}
