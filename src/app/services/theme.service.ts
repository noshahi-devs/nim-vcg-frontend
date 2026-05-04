import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'nim_theme_preference';
  private readonly COLOR_KEY = 'nim_custom_color';
  private readonly SECONDARY_COLOR_KEY = 'nim_custom_secondary_color';

  setTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  setCustomColor(color: string): void {
    if (!color) return;
    document.documentElement.style.setProperty('--primary-color', color);
    // Generate lighter and deeper versions for gradients/hovers (using alpha channels)
    document.documentElement.style.setProperty('--primary-light', color + 'cc'); 
    document.documentElement.style.setProperty('--primary-deep', color + 'e6'); 
    
    // Extract RGB for rgba() usage
    const rgb = this.hexToRgb(color);
    if (rgb) {
      document.documentElement.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    // Update select chevron color dynamically
    const encodedColor = encodeURIComponent(color);
    const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${encodedColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
    document.documentElement.style.setProperty('--select-chevron', chevronSvg);

    // Set contrast color
    const contrastColor = this.getContrastColor(color);
    document.documentElement.style.setProperty('--primary-contrast', contrastColor);

    localStorage.setItem(this.COLOR_KEY, color);
  }

  private getContrastColor(hexcolor: string): string {
    if (!hexcolor) return '#ffffff';
    // If a lead # is provided, remove it
    if (hexcolor.startsWith('#')) {
      hexcolor = hexcolor.slice(1);
    }

    // If a three-character hexcode, make it six
    if (hexcolor.length === 3) {
      hexcolor = hexcolor.split('').map(hex => hex + hex).join('');
    }

    // Convert to RGB value
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    // Get YIQ ratio
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Check contrast
    return (yiq >= 128) ? '#1e293b' : '#ffffff';
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  setSecondaryColor(color: string): void {
    if (!color) return;
    document.documentElement.style.setProperty('--secondary-color', color);
    document.documentElement.style.setProperty('--accent-color', color);

    const contrastColor = this.getContrastColor(color);
    document.documentElement.style.setProperty('--secondary-contrast', contrastColor);

    localStorage.setItem(this.SECONDARY_COLOR_KEY, color);
  }

  getSavedTheme(): string {
    return localStorage.getItem(this.THEME_KEY) || 'light';
  }

  getSavedCustomColor(): string | null {
    return localStorage.getItem(this.COLOR_KEY);
  }

  getSavedSecondaryColor(): string | null {
    return localStorage.getItem(this.SECONDARY_COLOR_KEY);
  }

  applySavedTheme(): void {
    const theme = this.getSavedTheme();
    const color = this.getSavedCustomColor();
    const secondaryColor = this.getSavedSecondaryColor();

    if (theme !== 'light') {
      this.setTheme(theme);
    }

    if (color) {
      this.setCustomColor(color);
    }

    if (secondaryColor) {
      this.setSecondaryColor(secondaryColor);
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
