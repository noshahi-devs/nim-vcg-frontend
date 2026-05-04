import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ExamScheduleStandardVm } from '../Models/exam-schedule-standard-vm';
import { Observable } from 'rxjs';
import { CreateExamScheduleStandardVM } from '../Models/create-exam-schedule-standard-vm';
import { UpdateExamScheduleStandardVM } from '../Models/update-exam-schedule-standard-vm';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamScheduleStandardService {
  getAll(): Observable<ExamScheduleStandardVm[]> {
    return this.GetExamScheduleStandards();
  }

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  apiUrl: string = `${environment.apiBaseUrl}/api/ExamScheduleStandards`;

  public GetExamScheduleStandards(): Observable<ExamScheduleStandardVm[]> {
    return this.http.get<ExamScheduleStandardVm[]>(this.apiUrl, this.getAuthHeaders());
  }
  public GetExamScheduleStandardsByID(id: number): Observable<ExamScheduleStandardVm> {
    return this.http.get<ExamScheduleStandardVm>(this.apiUrl + '/' + id, this.getAuthHeaders());
  }
  public SaveExamScheduleStandards(examScheduleStandard: CreateExamScheduleStandardVM): Observable<any> {
    return this.http.post(this.apiUrl, examScheduleStandard, this.getAuthHeaders());
  }

  updateExamScheduleStandards(examScheduleStandard: UpdateExamScheduleStandardVM): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/' + examScheduleStandard.examScheduleStandardId, examScheduleStandard, this.getAuthHeaders());
  }

  public DeleteExamScheduleStandard(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + '/' + id, this.getAuthHeaders());
  }




}
