import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  iconFilled: string;
  route: string;
}

@Component({
  selector: 'app-bottom-nav-bar',
  standalone: true,
  imports: [NgClass, RouterLink],
  styleUrl: './bottom-nav-bar.component.scss',
  template: `
    <nav class="bottom-nav-bar">
      @for (item of items; track item.route) {
        <a
          class="bottom-nav-bar__item"
          [routerLink]="item.route"
          [ngClass]="{ 'bottom-nav-bar__item--active': activeRoute === item.route }"
          [attr.aria-label]="item.label"
          [attr.aria-current]="activeRoute === item.route ? 'page' : null"
        >
          <span class="bottom-nav-bar__icon-container">
            <span class="material-symbols-outlined bottom-nav-bar__icon">
              {{ activeRoute === item.route ? item.iconFilled : item.icon }}
            </span>
          </span>
          <span class="bottom-nav-bar__label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
})
export class BottomNavBarComponent {
  @Input({ required: true }) items!: NavItem[];
  @Input() activeRoute = '';
}
