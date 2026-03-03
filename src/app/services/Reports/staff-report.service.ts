import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StaffReportService {

  options: any = {
    responseType: 'text'
  }
  constructor(private http: HttpClient) { }

  apiUrl: string = `${environment.apiBaseUrl}/api/WebReports`;

  public GetReport(): Observable<any> {
    return this.http.get<any>(this.apiUrl , this.options);
  }
}
