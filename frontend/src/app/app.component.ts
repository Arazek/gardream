import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import Keycloak from 'keycloak-js';

import { ThemeService } from './core/theme/theme.service';
import { LocalDbService } from './core/db/local-db.service';
import { SyncService } from './core/sync/sync.service';
import { LocalNotificationsService } from './core/notifications/local-notifications.service';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, OfflineBannerComponent],
  template: `
    <ion-app>
      <app-offline-banner />
      <ion-router-outlet />
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  private db = inject(LocalDbService);
  private syncService = inject(SyncService);
  private notifications = inject(LocalNotificationsService);
  private keycloak = inject(Keycloak);

  constructor() {
    inject(ThemeService);
  }

  async ngOnInit(): Promise<void> {
    // Init local SQLite database
    await this.db.init();

    // Start sync service (registers network + foreground listeners)
    this.syncService.start();

    // If authenticated, do initial pull to seed local DB from server
    if (this.keycloak.authenticated) {
      await this.syncService.initialPull();
    }

    // Request notification permission (no-op if already granted/denied)
    await this.notifications.requestPermission();
  }
}
