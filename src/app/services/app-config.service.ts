import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SettingsService, SystemSetting } from './settings.service';
import { ThemeService } from './theme.service';

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    private configSubject = new BehaviorSubject<any>({
        instituteName: 'Vision College',
        instituteLogo: 'assets/images/Vision College emblem design.png',
        instituteAddress: '',
        institutePhone: '',
        instituteEmail: '',
        currencySymbol: 'PKR',
        primaryColor: '',
        secondaryColor: '',
        preferredTheme: 'light',
        loginDesign: 'modern'
    });

    public config$ = this.configSubject.asObservable();

    constructor(private settingsService: SettingsService, private themeService: ThemeService) { }

    loadConfig(): Observable<SystemSetting[]> {
        return this.settingsService.getGeneralSettings().pipe(
            tap(settings => {
                if (settings && settings.length > 0) {
                    const newConfig = { ...this.configSubject.value };
                    settings.forEach(s => {
                        if (s.settingKey === 'instituteName') newConfig.instituteName = s.settingValue;
                        if (s.settingKey === 'logoUrl') newConfig.instituteLogo = s.settingValue;
                        if (s.settingKey === 'instituteAddress') newConfig.instituteAddress = s.settingValue;
                        if (s.settingKey === 'institutePhone') newConfig.institutePhone = s.settingValue;
                        if (s.settingKey === 'instituteEmail') newConfig.instituteEmail = s.settingValue;
                        if (s.settingKey === 'currencySymbol') newConfig.currencySymbol = s.settingValue;
                        if (s.settingKey === 'primaryColor') newConfig.primaryColor = s.settingValue;
                        if (s.settingKey === 'secondaryColor') newConfig.secondaryColor = s.settingValue;
                        if (s.settingKey === 'preferredTheme') newConfig.preferredTheme = s.settingValue;
                        if (s.settingKey === 'loginDesign') newConfig.loginDesign = s.settingValue;
                    });
                    this.configSubject.next(newConfig);

                    // Dynamically apply theme settings to the entire application
                    if (newConfig.primaryColor) {
                        this.themeService.setCustomColor(newConfig.primaryColor);
                    }
                    if (newConfig.secondaryColor) {
                        this.themeService.setSecondaryColor(newConfig.secondaryColor);
                    }
                    if (newConfig.preferredTheme) {
                        this.themeService.setTheme(newConfig.preferredTheme);
                    }
                }
            }),
            catchError(err => {
                console.error('Failed to load global config', err);
                return of([]);
            })
        );
    }

    getConfig() {
        return this.configSubject.value;
    }
}

