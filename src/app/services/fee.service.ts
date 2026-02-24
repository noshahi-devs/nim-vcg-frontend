import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Fee } from '../Models/fee';

@Injectable({
  providedIn: 'root'
})
export class FeeService {
  private apiUrl = 'http://localhost:5257/api/Fees';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // Method to fetch all fees
  getAllFees(): Observable<Fee[]> {
    return this.http.get<Fee[]>(this.apiUrl, this.getAuthHeaders());
  }

  // Method to fetch a specific fee by ID
  getFeeById(id: number): Observable<Fee> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Fee>(url, this.getAuthHeaders());
  }

  // Method to create a new fee
  createFee(fee: Fee): Observable<Fee> {
    return this.http.post<Fee>(this.apiUrl, fee, this.getAuthHeaders());
  }

  // Method to update an existing fee
  updateFee(fee: Fee): Observable<Fee> {
    const url = `${this.apiUrl}/${fee.feeId}`;
    return this.http.put<Fee>(url, fee, this.getAuthHeaders());
  }

  // Method to delete a fee by ID
  deleteFee(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url, this.getAuthHeaders());
  }
}
