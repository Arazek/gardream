import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, settingsOutline, statsChartOutline,
  documentTextOutline, cashOutline, chevronForwardOutline,
  chevronBackOutline, chevronDownOutline, menuOutline,
  shieldOutline, notificationsOutline, helpCircleOutline,
} from 'ionicons/icons';

export interface SidebarItem {
  label: string;
  icon: string;
  route?: string;
  badge?: number;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [IonIcon],
  styleUrl: './sidebar.component.scss',
  template: `
    <nav class="sidebar" [class.sidebar--collapsed]="collapsed">

      <div class="sidebar__header">
        @if (!collapsed) {
          <span class="sidebar__brand">Admin</span>
        }
        <button class="sidebar__toggle" (click)="toggleCollapsed()" [attr.aria-label]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <ion-icon [name]="collapsed ? 'chevron-forward-outline' : 'chevron-back-outline'" />
        </button>
      </div>

      <ul class="sidebar__list" role="list">
        @for (item of items; track item.label) {
          <li class="sidebar__item">
            <button
              class="sidebar__link"
              [class.sidebar__link--active]="activeRoute === item.route"
              (click)="onItemClick(item)"
              [attr.aria-label]="item.label"
              [attr.title]="collapsed ? item.label : null"
            >
              <ion-icon class="sidebar__icon" [name]="item.icon" />
              @if (!collapsed) {
                <span class="sidebar__label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="sidebar__badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
                }
                @if (item.children?.length) {
                  <ion-icon
                    class="sidebar__chevron"
                    [class.sidebar__chevron--open]="isExpanded(item)"
                    name="chevron-down-outline"
                  />
                }
              } @else {
                @if (item.badge) {
                  <span class="sidebar__badge sidebar__badge--dot"></span>
                }
              }
            </button>

            @if (item.children?.length && !collapsed && isExpanded(item)) {
              <ul class="sidebar__children" role="list">
                @for (child of item.children; track child.label) {
                  <li>
                    <button
                      class="sidebar__link sidebar__link--child"
                      [class.sidebar__link--active]="activeRoute === child.route"
                      (click)="onItemClick(child)"
                    >
                      <ion-icon class="sidebar__icon sidebar__icon--sm" [name]="child.icon" />
                      <span class="sidebar__label">{{ child.label }}</span>
                      @if (child.badge) {
                        <span class="sidebar__badge">{{ child.badge }}</span>
                      }
                    </button>
                  </li>
                }
              </ul>
            }
          </li>
        }
      </ul>

    </nav>
  `,
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
  @Input() collapsed = false;
  @Input() activeRoute = '';
  @Output() itemClick = new EventEmitter<SidebarItem>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  private expandedItems = new Set<string>();

  constructor() {
    addIcons({
      homeOutline, peopleOutline, settingsOutline, statsChartOutline,
      documentTextOutline, cashOutline, chevronForwardOutline,
      chevronBackOutline, chevronDownOutline, menuOutline,
      shieldOutline, notificationsOutline, helpCircleOutline,
    });
  }

  isExpanded(item: SidebarItem): boolean {
    return this.expandedItems.has(item.label);
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  onItemClick(item: SidebarItem): void {
    if (item.children?.length) {
      if (this.expandedItems.has(item.label)) {
        this.expandedItems.delete(item.label);
      } else {
        this.expandedItems.add(item.label);
      }
    } else {
      this.itemClick.emit(item);
    }
  }
}
