import { Component, inject } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, list, settingsOutline, leaf } from 'ionicons/icons';
import { BreakpointService } from '../../core/breakpoint.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, ShellComponent],
  template: `
    <app-shell>
      <ion-tabs>
        <ion-router-outlet />
        <ion-tab-bar slot="bottom" [class.ion-hide]="!breakpoint.isMobile()">
          <ion-tab-button tab="home" href="/tabs/home">
            <ion-icon name="home" />
            <ion-label>Home</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="example" href="/tabs/example">
            <ion-icon name="list" />
            <ion-label>Items</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="garden" href="/tabs/garden">
            <ion-icon name="leaf" />
            <ion-label>Garden</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="settings" href="/tabs/settings">
            <ion-icon name="settings-outline" />
            <ion-label>Settings</ion-label>
          </ion-tab-button>

        </ion-tab-bar>
      </ion-tabs>
    </app-shell>
  `,
})
export class TabsPage {
  readonly breakpoint = inject(BreakpointService);

  constructor() {
    addIcons({ home, list, settingsOutline, leaf });
  }
}
