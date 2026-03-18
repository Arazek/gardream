import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';
import { KeycloakProfile } from 'keycloak-js';
import { AuthService } from '../../../core/auth/auth.service';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, AvatarComponent],
  styleUrl: './page-header.component.scss',
  template: `
    <ion-header class="page-header" [translucent]="translucent">
      <ion-toolbar>
        @if (showMenu) {
          <ion-buttons slot="start">
            <ion-button fill="clear" (click)="menuClick.emit()">
              <ion-icon slot="icon-only" name="menu-outline" />
            </ion-button>
          </ion-buttons>
        } @else if (showBack) {
          <ion-buttons slot="start">
            <ion-back-button [defaultHref]="backHref" />
          </ion-buttons>
        }
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ng-content select="[slot=end]" />
          @if (showAvatar) {
            <button class="page-header__avatar-btn" (click)="goToProfile()" aria-label="Profile">
              <app-avatar [name]="fullName" size="sm" />
            </button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
})
export class PageHeaderComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  profile: KeycloakProfile | null = null;

  get fullName(): string {
    if (!this.profile) return '';
    return [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ');
  }

  constructor() { addIcons({ menuOutline }); }

  async ngOnInit(): Promise<void> {
    this.profile = await this.auth.getProfile();
  }

  goToProfile(): void {
    this.router.navigateByUrl('/tabs/profile');
  }

  @Input() title = '';
  @Input() showBack = false;
  @Input() backHref = '/';
  @Input() translucent = true;
  @Input() showMenu = false;
  @Input() showAvatar = true;
  @Output() menuClick = new EventEmitter<void>();
}
