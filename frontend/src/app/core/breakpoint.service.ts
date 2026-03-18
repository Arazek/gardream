import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  readonly isMobile = signal(this.check());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const mql = window.matchMedia('(max-width: 767px)');
      mql.addEventListener('change', (e) => {
        this.ngZone.run(() => this.isMobile.set(e.matches));
      });
    }
  }

  private check(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.matchMedia('(max-width: 767px)').matches;
  }
}
