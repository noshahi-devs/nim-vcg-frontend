import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentGatewaySetting {
    id: number;
    gatewayName: string;
    apiKey: string;
    secretKey: string;
    isActive: boolean;
    isTestMode: boolean;
    transactionFee: number;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentGatewayService {
    private apiUrl = 'https://localhost:7225/api/PaymentGateways';

    constructor(private http: HttpClient) { }

    // Helper function to add token header
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getGateways(): Observable<PaymentGatewaySetting[]> {
        return this.http.get<PaymentGatewaySetting[]>(this.apiUrl, this.getAuthHeaders());
    }

    getGateway(id: number): Observable<PaymentGatewaySetting> {
        return this.http.get<PaymentGatewaySetting>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }

    createGateway(gateway: PaymentGatewaySetting): Observable<PaymentGatewaySetting> {
        return this.http.post<PaymentGatewaySetting>(this.apiUrl, gateway, this.getAuthHeaders());
    }

    updateGateway(id: number, gateway: PaymentGatewaySetting): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, gateway, this.getAuthHeaders());
    }

    deleteGateway(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }
}
