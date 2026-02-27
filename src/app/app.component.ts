import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import $ from 'jquery';
import { Subscription } from 'rxjs';
import { ThemeService } from './services/theme.service';
import { AppConfigService } from './services/app-config.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'nim-vcg-frontend';
  currentThemeSetting: string = 'light';

  constructor(
    private themeService: ThemeService,
    private appConfig: AppConfigService
  ) { }

  ngOnInit(): void {
    const localStorageTheme = localStorage.getItem('theme');
    this.currentThemeSetting = this.themeService.calculateSettingAsThemeString(localStorageTheme);
    this.themeService.updateThemeOnHtmlEl(this.currentThemeSetting);

    // Load dynamic config
    this.appConfig.loadConfig().subscribe();
  }
}
