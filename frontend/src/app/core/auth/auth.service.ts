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
    // Extract profile from JWT token claims instead of calling the account endpoint
    try {
      const token = await this.keycloak.getToken();
      if (!token) {
        return {};
      }

      // Decode JWT payload (format: header.payload.signature)
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

  async getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  login(): Promise<void> {
    return this.keycloak.login({ redirectUri: window.location.origin });
  }

  async logout(): Promise<void> {
    // Clear all local auth-related storage
    localStorage.removeItem('auth_token');

    // Clear any Keycloak callback data stored in localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('kc-')) {
        localStorage.removeItem(key);
      }
    });

    // Logout from Keycloak (will redirect to /login)
    return this.keycloak.logout(window.location.origin + '/login');
  }

  hasRole(role: string): boolean {
    return this.keycloak.isUserInRole(role);
  }
}
