import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeeType } from '../Models/feetype';

@Injectable({
  providedIn: 'root'
})
export class FeeTypeService {

  private apiUrl = 'http://localhost:5257/api/FeeTypes';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // Retrieve all fee types
  getFeeTypes(): Observable<FeeType[]> {
    return this.http.get<FeeType[]>(this.apiUrl, this.getAuthHeaders());
  }

  // Retrieve a specific fee type by ID
  getFeeTypeById(id: number): Observable<FeeType> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<FeeType>(url, this.getAuthHeaders());
  }

  // Create a new fee type
  createFeeType(feeTypeData: FeeType): Observable<FeeType> {
    return this.http.post<FeeType>(this.apiUrl, feeTypeData, this.getAuthHeaders());
  }




  // Update an existing fee type
  updateFeeType(feeType: FeeType): Observable<FeeType> {
    const url = `${this.apiUrl}/${feeType.feeTypeId}`;
    return this.http.put<FeeType>(url, feeType, this.getAuthHeaders());
  }

  // Delete a fee type
  deleteFeeType(id: number): Observable<FeeType> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<FeeType>(url, this.getAuthHeaders());
  }
}
