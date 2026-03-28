import { Injectable, effect, signal } from '@angular/core';

export type ColorScheme = 'light' | 'dark' | 'system';

const STORAGE_SCHEME = 'app-scheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly scheme = signal<ColorScheme>(this.readScheme());

  constructor() {
    // Apply initial scheme
    this.applyScheme(this.scheme());
    
    // Watch for system preference changes when scheme is 'system'
    effect(() => {
      const scheme = this.scheme();
      this.applyScheme(scheme);
      
      if (scheme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => {
          this.applyScheme('system');
        };
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      }
      return undefined;
    });
  }

  setScheme(scheme: ColorScheme): void {
    this.scheme.set(scheme);
    localStorage.setItem(STORAGE_SCHEME, scheme);
  }

  toggleScheme(): void {
    const current = this.scheme();
    if (current === 'light') {
      this.setScheme('dark');
    } else if (current === 'dark') {
      this.setScheme('light');
    } else {
      // If system, toggle to explicit dark/light based on current appearance
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setScheme(isDark ? 'light' : 'dark');
    }
  }

  private readScheme(): ColorScheme {
    return (localStorage.getItem(STORAGE_SCHEME) as ColorScheme) ?? 'system';
  }

  private applyScheme(scheme: ColorScheme): void {
    document.body.classList.remove('light', 'dark');
    
    if (scheme === 'system') {
      // Apply system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
      }
    } else {
      document.body.classList.add(scheme);
    }
  }
}
