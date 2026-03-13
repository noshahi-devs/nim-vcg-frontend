import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../pages/ui-elements/breadcrumb/breadcrumb.component';
import { ThemeService } from '../services/theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-theme',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [BreadcrumbComponent, CommonModule, FormsModule],
  templateUrl: './theme.component.html',
  styleUrl: './theme.component.css'
})
export class ThemeComponent implements OnInit {
  title = 'Theme';
  currentTheme = 'light';
  customColor = '#800000';

  themes = [
    { id: 'light', name: 'Alabaster Light', primary: '#800000', bg: '#fffafb' },
    { id: 'dark', name: 'Obsidian Dark', primary: '#6366f1', bg: '#0f172a' },
    { id: 'midnight', name: 'Midnight Neon', primary: '#a855f7', bg: '#020617' },
    { id: 'sunset', name: 'Crimson Sunset', primary: '#f97316', bg: '#fff7ed' },
    { id: 'nature', name: 'Emerald Nature', primary: '#10b981', bg: '#f0fdf4' }
  ];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getSavedTheme();
    this.customColor = this.themeService.getSavedCustomColor() || '#800000';
  }

  selectTheme(themeId: string): void {
    this.currentTheme = themeId;
    this.themeService.setTheme(themeId);
  }

  applyCustomColor(): void {
    this.themeService.setCustomColor(this.customColor);
  }

  resetTheme(): void {
    this.selectTheme('light');
    this.customColor = '#800000';
    this.themeService.setCustomColor(this.customColor);
  }
}
