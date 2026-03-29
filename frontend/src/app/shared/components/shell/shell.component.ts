import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { BreakpointService } from '../../../core/breakpoint.service';
import { SidebarComponent, SidebarItem } from '../sidebar/sidebar.component';
import { DrawerComponent } from '../drawer/drawer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SidebarComponent, DrawerComponent, RouterModule],
  styleUrl: './shell.component.scss',
  host: { class: 'shell-host' },
  template: `
    <div class="shell">
      @if (!breakpoint.isMobile()) {
        <app-sidebar
          [items]="navItems"
          [collapsed]="sidebarCollapsed()"
          [activeRoute]="router.url"
          (collapsedChange)="sidebarCollapsed.set($event)"
          (itemClick)="navigate($event)"
        />
      }
      <div class="shell__content">
        <ng-content />
      </div>
    </div>

    @if (breakpoint.isMobile()) {
      <app-drawer
        position="left"
        width="280px"
        title="Menu"
        [open]="drawerOpen()"
        (closed)="drawerOpen.set(false)"
      >
        <app-sidebar
          [items]="navItems"
          [activeRoute]="router.url"
          (itemClick)="navigate($event)"
        />
      </app-drawer>
    }
  `,
})
export class ShellComponent {
  readonly breakpoint = inject(BreakpointService);
  readonly router = inject(Router);

  readonly sidebarCollapsed = signal(false);
  readonly drawerOpen = signal(false);

  constructor() { }

  readonly navItems: SidebarItem[] = [
    { label: 'My Garden', icon: 'psychology_alt', route: '/tabs/home' },
    { label: 'Plots',     icon: 'grid_view',      route: '/tabs/plots' },
    { label: 'Calendar',  icon: 'calendar_today', route: '/tabs/calendar' },
    { label: 'Library',   icon: 'local_library',  route: '/tabs/library' },
    { label: 'Settings',  icon: 'person',         route: '/tabs/settings' },
  ];

  navigate(item: SidebarItem): void {
    if (item.route) {
      this.router.navigateByUrl(item.route);
      this.drawerOpen.set(false);
    }
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }
}
