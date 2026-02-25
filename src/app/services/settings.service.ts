import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    private apiUrl = 'http://localhost:5257/api/Settings';

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
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
