import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemSetting {
    id?: number;
    settingKey: string;
    settingValue: string;
    category?: string;
    updatedAt?: string;
}

export interface NotificationSetting {
    id: number;
    settingKey: string;
    isEnabled: boolean;
    description?: string;
    category: string;
}

export interface PaymentGatewaySetting {
    id: number;
    gatewayName: string;
    apiKey: string;
    apiSecret: string;
    merchantId: string;
    isActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private apiUrl = `${environment.apiBaseUrl}/api/Settings`;

    private schoolInfo$ = new ReplaySubject<any>(1);

    constructor(private http: HttpClient) { 
        this.refreshSchoolInfo();
    }

    refreshSchoolInfo() {
        this.getGeneralSettings().subscribe(settings => {
            const info: any = {};
            settings.forEach(s => info[s.settingKey] = s.settingValue);
            this.schoolInfo$.next(info);
        });
    }

    getSchoolInfo(): Observable<any> {
        return this.schoolInfo$.asObservable();
    }

    private getAuthHeaders() {
        const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    // General Settings
    getGeneralSettings(): Observable<SystemSetting[]> {
        return this.http.get<SystemSetting[]>(`${this.apiUrl}/general`, this.getAuthHeaders());
    }

    updateGeneralSettings(settings: SystemSetting[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/general`, settings, this.getAuthHeaders());
    }

    // Notification Settings
    getNotificationSettings(): Observable<NotificationSetting[]> {
        return this.http.get<NotificationSetting[]>(`${this.apiUrl}/notifications`, this.getAuthHeaders());
    }

    updateNotificationSettings(settings: NotificationSetting[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/notifications`, settings, this.getAuthHeaders());
    }

    // Payment Gateway Settings
    getPaymentGatewaySettings(): Observable<PaymentGatewaySetting[]> {
        return this.http.get<PaymentGatewaySetting[]>(`${this.apiUrl}/payment-gateway`, this.getAuthHeaders());
    }

    updatePaymentGatewaySetting(setting: PaymentGatewaySetting): Observable<any> {
        return this.http.post(`${this.apiUrl}/payment-gateway`, setting, this.getAuthHeaders());
    }
}
