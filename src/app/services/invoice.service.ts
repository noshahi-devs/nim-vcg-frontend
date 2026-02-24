import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Invoice {
    invoiceId: number;
    invoiceNumber: string;
    studentName: string;
    date: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
    type: string;
}

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    private apiUrl = 'http://localhost:5257/api/Invoices';

    constructor(private http: HttpClient) { }

    getInvoices(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(this.apiUrl);
    }

    getInvoiceDetails(type: string, id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${type}/${id}`);
    }
}
