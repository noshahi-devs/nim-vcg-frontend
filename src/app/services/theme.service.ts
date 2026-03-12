import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'nim_theme_preference';
  private readonly COLOR_KEY = 'nim_custom_color';

  setTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  setCustomColor(color: string): void {
    document.documentElement.style.setProperty('--primary-color', color);
    // Generate a lighter version for gradients/hovers (simplified for now)
    document.documentElement.style.setProperty('--primary-light', color + 'cc'); 
    localStorage.setItem(this.COLOR_KEY, color);
  }

  getSavedTheme(): string {
    return localStorage.getItem(this.THEME_KEY) || 'light';
  }

  getSavedCustomColor(): string | null {
    return localStorage.getItem(this.COLOR_KEY);
  }

  applySavedTheme(): void {
    const theme = this.getSavedTheme();
    const color = this.getSavedCustomColor();

    if (theme !== 'light') {
      this.setTheme(theme);
    }

    if (color) {
      this.setCustomColor(color);
    }
  }

  updateThemeOnHtmlEl(theme: string): void {
    this.setTheme(theme);
  }

  updateButton(buttonEl: HTMLElement, isDark: boolean): void {
    const newCta = isDark ? 'dark' : 'light';
    buttonEl.setAttribute('aria-label', newCta);
    buttonEl.innerText = newCta;
  }

  calculateSettingAsThemeString(localStorageTheme: string | null): string {
    return localStorageTheme || 'light';
  }
}
