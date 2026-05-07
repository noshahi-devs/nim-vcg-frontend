import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FeatureRequest {
  title: string;
  category: string;
  description: string;
  userEmail?: string;
  userName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private apiUrl = `${environment.apiBaseUrl}/api/Support`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  submitFeature(data: FeatureRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/SubmitFeature`, data, this.getAuthHeaders());
  }
}
