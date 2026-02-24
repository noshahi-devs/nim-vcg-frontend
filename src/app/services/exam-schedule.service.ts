import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExamScheduleVm } from '../Models/exam-schedule-vm';
import { GetExamScheduleOptionsResponse } from '../Models/get-exam-schedule-options-response';
import { ExamSchedule } from '../Models/exam-schedule';

@Injectable({
  providedIn: 'root'
})
export class ExamScheduleService {

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  apiUrl: string = "http://localhost:5257/api/ExamSchedules";

  public GetExamSchedules(): Observable<ExamScheduleVm[]> {
    return this.http.get<ExamScheduleVm[]>(this.apiUrl, this.getAuthHeaders());
  }

  public GetExamScheduleOptions(): Observable<GetExamScheduleOptionsResponse[]> {
    return this.http.get<GetExamScheduleOptionsResponse[]>(this.apiUrl + '/GetExamScheduleOptions', this.getAuthHeaders());
  }

  public GetExamScheduleById(id: number): Observable<ExamScheduleVm> {
    return this.http.get<ExamScheduleVm>(this.apiUrl + '/' + id, this.getAuthHeaders());
  }

  public SaveExamSchedule(examSchedule: ExamSchedule): Observable<any> {
    return this.http.post<ExamSchedule>(this.apiUrl, examSchedule, this.getAuthHeaders());
  }

  public UpdateExamSchedule(examSchedule: ExamSchedule): Observable<ExamSchedule> {
    return this.http.put<ExamSchedule>(this.apiUrl + '/' + examSchedule.examScheduleId, examSchedule, this.getAuthHeaders());
  }
  public DeleteExamSchedule(id: number): Observable<ExamSchedule> {
    return this.http.delete<ExamSchedule>(this.apiUrl + '/' + id, this.getAuthHeaders());
  }



}
