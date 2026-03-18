import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private keycloak: KeycloakService) {}

  async isLoggedIn(): Promise<boolean> {
    return this.keycloak.isLoggedIn();
  }

  async getProfile(): Promise<KeycloakProfile> {
    return this.keycloak.loadUserProfile();
  }

  async getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  login(): Promise<void> {
    return this.keycloak.login({ redirectUri: window.location.origin });
  }

  logout(): Promise<void> {
    return this.keycloak.logout(window.location.origin + '/login');
  }

  hasRole(role: string): boolean {
    return this.keycloak.isUserInRole(role);
  }
}
