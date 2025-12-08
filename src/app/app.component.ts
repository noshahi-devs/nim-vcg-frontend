import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import $ from 'jquery';
import { Subscription } from 'rxjs';
import { ThemeService } from './services/theme.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgApexchartsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  currentThemeSetting: string = 'light';
  constructor(private themeService : ThemeService) { }
  
  ngOnInit(): void {
    const localStorageTheme = localStorage.getItem('theme');
    this.currentThemeSetting = this.themeService.calculateSettingAsThemeString(localStorageTheme);
    this.themeService.updateThemeOnHtmlEl(this.currentThemeSetting);
  }



}
