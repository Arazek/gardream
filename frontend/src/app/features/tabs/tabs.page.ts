import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { IonTabs, IonRouterOutlet } from '@ionic/angular/standalone';
import { filter, map } from 'rxjs/operators';

import { BreakpointService } from '../../core/breakpoint.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { BottomNavBarComponent, NavItem } from '../../shared';

const NAV_ITEMS: NavItem[] = [
  { label: 'My Garden', icon: 'psychology_alt', iconFilled: 'psychology_alt', route: '/tabs/home' },
  { label: 'Plots',     icon: 'grid_view',      iconFilled: 'grid_view',      route: '/tabs/plots' },
  { label: 'Calendar',  icon: 'calendar_today', iconFilled: 'calendar_today', route: '/tabs/calendar' },
  { label: 'Library',   icon: 'local_library',  iconFilled: 'local_library',  route: '/tabs/library' },
];

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [RouterModule, IonTabs, IonRouterOutlet, ShellComponent, BottomNavBarComponent],
  template: `
    <app-shell>
      <ion-tabs>
        <ion-router-outlet />
      </ion-tabs>
    </app-shell>
    @if (breakpoint.isMobile()) {
      <app-bottom-nav-bar [items]="navItems" [activeRoute]="activeRoute" />
    }
  `,
})
export class TabsPage implements OnInit {
  readonly breakpoint = inject(BreakpointService);
  private readonly router = inject(Router);

  readonly navItems = NAV_ITEMS;
  activeRoute = '/tabs/home';

  ngOnInit(): void {
    this.activeRoute = this.router.url.split('?')[0];
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects.split('?')[0]),
    ).subscribe(url => (this.activeRoute = url));
  }
}
