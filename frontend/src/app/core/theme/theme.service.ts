import { Injectable, effect, signal } from '@angular/core';

export type Accent = 'clay' | 'moss' | 'dune' | 'slate' | null;
export type ColorScheme = 'light' | 'dark' | 'system';

const STORAGE_ACCENT = 'app-accent';
const STORAGE_SCHEME = 'app-scheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly accent = signal<Accent>(this.readAccent());
  readonly scheme = signal<ColorScheme>(this.readScheme());

  constructor() {
    effect(() => this.applyAccent(this.accent()));
    effect(() => this.applyScheme(this.scheme()));
  }

  setAccent(accent: Accent): void {
    this.accent.set(accent);
    if (accent) localStorage.setItem(STORAGE_ACCENT, accent);
    else localStorage.removeItem(STORAGE_ACCENT);
  }

  setScheme(scheme: ColorScheme): void {
    this.scheme.set(scheme);
    localStorage.setItem(STORAGE_SCHEME, scheme);
  }

  private readAccent(): Accent {
    return (localStorage.getItem(STORAGE_ACCENT) as Accent) ?? null;
  }

  private readScheme(): ColorScheme {
    return (localStorage.getItem(STORAGE_SCHEME) as ColorScheme) ?? 'system';
  }

  private applyAccent(accent: Accent): void {
    if (accent) document.body.setAttribute('data-accent', accent);
    else document.body.removeAttribute('data-accent');
  }

  private applyScheme(scheme: ColorScheme): void {
    document.body.classList.remove('light', 'dark');
    if (scheme !== 'system') document.body.classList.add(scheme);
  }
}
