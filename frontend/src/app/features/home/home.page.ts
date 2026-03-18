import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  constructOutline,
  settingsOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { KeycloakProfile } from 'keycloak-js';

import { AuthService } from '../../core/auth/auth.service';
import { PageHeaderComponent, SectionComponent, CardComponent } from '../../shared';

interface NavCard {
  label: string;
  sub: string;
  icon: string;
  iconColor: string;
  route: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, IonIcon, PageHeaderComponent, SectionComponent, CardComponent],
  styleUrl: './home.page.scss',
  template: `
    <app-page-header title="Home" />

    <ion-content class="home-content">

      <div class="home-greeting">
        <p class="home-greeting__label">Welcome back,</p>
        <h1 class="home-greeting__name">{{ firstName || 'there' }}</h1>
      </div>

      <app-section title="Garden">
        <div class="home-cards">
          @for (card of gardenCards; track card.route) {
            <app-card class="home-card" [clickable]="true" (cardClick)="navigate(card.route)">
              <div class="home-card__body">
                <div class="home-card__icon-wrap" [style.background]="card.iconColor + '18'">
                  <ion-icon class="home-card__icon" [name]="card.icon" [style.color]="card.iconColor" />
                </div>
                <div class="home-card__text">
                  <p class="home-card__label">{{ card.label }}</p>
                  <p class="home-card__sub">{{ card.sub }}</p>
                </div>
                <ion-icon class="home-card__chevron" name="chevron-forward-outline" />
              </div>
            </app-card>
          }
        </div>
      </app-section>

      <app-section title="Quick actions">
        <div class="home-cards">
          @for (card of quickCards; track card.route) {
            <app-card class="home-card" [clickable]="true" (cardClick)="navigate(card.route)">
              <div class="home-card__body">
                <div class="home-card__icon-wrap" [style.background]="card.iconColor + '18'">
                  <ion-icon class="home-card__icon" [name]="card.icon" [style.color]="card.iconColor" />
                </div>
                <div class="home-card__text">
                  <p class="home-card__label">{{ card.label }}</p>
                  <p class="home-card__sub">{{ card.sub }}</p>
                </div>
                <ion-icon class="home-card__chevron" name="chevron-forward-outline" />
              </div>
            </app-card>
          }
        </div>
      </app-section>

    </ion-content>
  `,
})
export class HomePage implements OnInit {
  profile: KeycloakProfile | null = null;

  readonly gardenCards: NavCard[] = [
    {
      label: 'My Garden',
      sub: 'Crops, stats & harvests',
      icon: 'leaf-outline',
      iconColor: '#4a7c59',
      route: '/tabs/garden',
    },
    {
      label: 'Garden Builder',
      sub: 'Plan your planter layout',
      icon: 'construct-outline',
      iconColor: '#4a7c59',
      route: '/tabs/garden/builder',
    },
  ];

  readonly quickCards: NavCard[] = [
    {
      label: 'Settings',
      sub: 'Theme & account',
      icon: 'settings-outline',
      iconColor: '#6366f1',
      route: '/tabs/settings',
    },
  ];

  get firstName(): string {
    return this.profile?.firstName ?? '';
  }

  constructor(private auth: AuthService, private router: Router) {
    addIcons({ leafOutline, constructOutline, settingsOutline, chevronForwardOutline });
  }

  async ngOnInit(): Promise<void> {
    this.profile = await this.auth.getProfile();
  }

  navigate(route: string): void {
    this.router.navigateByUrl(route);
  }
}
