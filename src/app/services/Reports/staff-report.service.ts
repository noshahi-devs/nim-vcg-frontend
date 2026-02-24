import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StaffReportService {

  options: any = {
    responseType: 'text'
  }
  constructor(private http: HttpClient) { }

  apiUrl: string = "http://localhost:5257/api/WebReports";

  public GetReport(): Observable<any> {
    return this.http.get<any>(this.apiUrl , this.options);
  }
}
