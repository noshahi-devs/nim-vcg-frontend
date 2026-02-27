import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SettingsService, SystemSetting } from './settings.service';

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    private configSubject = new BehaviorSubject<any>({
        instituteName: 'Noshahi Institute',
        instituteLogo: 'assets/images/logo.png',
        instituteAddress: '',
        institutePhone: '',
        instituteEmail: '',
        currencySymbol: 'PKR'
    });

    public config$ = this.configSubject.asObservable();

    constructor(private settingsService: SettingsService) { }

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
                    });
                    this.configSubject.next(newConfig);
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
