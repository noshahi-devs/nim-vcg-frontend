import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BankAccount {
    bankAccountId: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
    accountType: string;
    balance: number;
    isActive: boolean;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BankAccountService {
    private apiUrl = 'http://localhost:5257/api/BankAccounts';

    constructor(private http: HttpClient) { }

    // Helper function to add token header
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getBankAccounts(): Observable<BankAccount[]> {
        return this.http.get<BankAccount[]>(this.apiUrl, this.getAuthHeaders());
    }

    getBankAccount(id: number): Observable<BankAccount> {
        return this.http.get<BankAccount>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }

    createBankAccount(account: BankAccount): Observable<BankAccount> {
        return this.http.post<BankAccount>(this.apiUrl, account, this.getAuthHeaders());
    }

    updateBankAccount(id: number, account: BankAccount): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, account, this.getAuthHeaders());
    }

    deleteBankAccount(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }
}
