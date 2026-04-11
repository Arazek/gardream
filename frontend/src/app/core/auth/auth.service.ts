import { Injectable, inject } from '@angular/core';
import { KeycloakProfile } from 'keycloak-js';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloak = inject(Keycloak);

  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  async getProfile(): Promise<KeycloakProfile> {
    try {
      const token = this.keycloak.token;
      if (!token) return {};

      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        username: payload.preferred_username,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        emailVerified: payload.email_verified,
      };
    } catch (err) {
      console.error('[AuthService] Failed to extract profile from token:', err);
      return {};
    }
  }

  getToken(): string {
    return this.keycloak.token ?? '';
  }

  login(): Promise<void> {
    return this.keycloak.login({ redirectUri: window.location.origin + '/tabs/home' });
  }

  async logout(): Promise<void> {
    return this.keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }

  hasRole(role: string): boolean {
    return this.keycloak.hasRealmRole(role);
  }
}
