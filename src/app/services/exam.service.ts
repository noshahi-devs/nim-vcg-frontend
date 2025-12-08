import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ============= INTERFACES/MODELS =============

export interface Exam {
  examId?: number;
  examName: string;
  examType: 'Term' | 'Monthly' | 'Quiz';
  classId: number;
  className?: string;
  sectionId: number;
  sectionName?: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdOn?: string;
}

export interface ExamSchedule {
  scheduleId?: number;
  examId: number;
  examName?: string;
  subjectId: number;
  subjectName?: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room?: string;
  invigilatorId?: number;
  invigilatorName?: string;
  createdOn?: string;
}

export interface MarksEntry {
  marksId?: number;
  examId: number;
  subjectId: number;
  studentId: number;
  rollNo?: string;
  studentName?: string;
  totalMarks: number;
  obtainedMarks: number;
  grade?: string;
  percentage?: number;
  remarks?: string;
  isPublished?: boolean;
  createdOn?: string;
}

export interface GradeScale {
  gradeId?: number;
  grade: string;  // ✅ This property exists
  minPercentage: number;
  maxPercentage: number;
  gradePoint?: number;
  remarks?: string;
  createdOn?: string;
}

export interface ExamResult {
  resultId?: number;
  examId: number;
  studentId: number;
  rollNo?: string;
  studentName?: string;
  className?: string;
  sectionName?: string;
  subjectId?: number;
  subjectName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  status?: 'Pass' | 'Fail';
  isPassed?: boolean;
  position?: number;
  subjects?: SubjectResult[];
  createdOn?: string;
}

export interface SubjectResult {
  subjectName: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
}

export interface ExamAnalytics {
  examId?: number;
  examName?: string;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passPercentage?: number;
  averagePercentage: number;
  highestScore?: number;
  lowestScore?: number;
  highestMarks?: number;
  lowestMarks?: number;
  topPerformer?: string;
  gradeDistribution?: { grade: string; count: number; percentage: number }[];
  subjectWiseAnalytics?: SubjectAnalytics[];
  subjectPerformance?: { subject: string; average: number; highest: number; lowest: number }[];
}

export interface SubjectAnalytics {
  subjectName: string;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'https://visioncollegegojra.com/api';

  constructor(private http: HttpClient) {}

  // ============= EXAM CRUD =============
  
  getAllExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(`${this.apiUrl}/Exams`);
  }

  getExamById(examId: number): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/Exams/${examId}`);
  }

  addExam(exam: Exam): Observable<Exam> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Exam>(`${this.apiUrl}/Exams`, exam, { headers });
  }

  updateExam(examId: number, exam: Exam): Observable<Exam> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<Exam>(`${this.apiUrl}/Exams/${examId}`, exam, { headers });
  }

  deleteExam(examId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Exams/${examId}`);
  }

  // ============= EXAM SCHEDULE CRUD =============
  
  getSchedulesByExam(examId: number): Observable<ExamSchedule[]> {
    return this.http.get<ExamSchedule[]>(`${this.apiUrl}/ExamSchedules/exam/${examId}`);
  }

  getScheduleById(scheduleId: number): Observable<ExamSchedule> {
    return this.http.get<ExamSchedule>(`${this.apiUrl}/ExamSchedules/${scheduleId}`);
  }

  addSchedule(schedule: ExamSchedule): Observable<ExamSchedule> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<ExamSchedule>(`${this.apiUrl}/ExamSchedules`, schedule, { headers });
  }

  updateSchedule(scheduleId: number, schedule: ExamSchedule): Observable<ExamSchedule> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<ExamSchedule>(`${this.apiUrl}/ExamSchedules/${scheduleId}`, schedule, { headers });
  }

  deleteSchedule(scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ExamSchedules/${scheduleId}`);
  }

  // ============= MARKS ENTRY CRUD =============
  
  getMarksByExamAndSubject(examId: number, subjectId: number): Observable<MarksEntry[]> {
    return this.http.get<MarksEntry[]>(`${this.apiUrl}/Marks/exam/${examId}/subject/${subjectId}`);
  }

  getMarksByStudent(studentId: number, examId: number): Observable<MarksEntry[]> {
    return this.http.get<MarksEntry[]>(`${this.apiUrl}/Marks/student/${studentId}/exam/${examId}`);
  }

  addMarks(marks: MarksEntry): Observable<MarksEntry> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<MarksEntry>(`${this.apiUrl}/Marks`, marks, { headers });
  }

  updateMarks(marksId: number, marks: MarksEntry): Observable<MarksEntry> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<MarksEntry>(`${this.apiUrl}/Marks/${marksId}`, marks, { headers });
  }

  bulkUpdateMarks(marksList: MarksEntry[]): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.apiUrl}/Marks/bulk`, marksList, { headers });
  }

  publishResults(examId: number, subjectId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Marks/publish`, { examId, subjectId });
  }

  // ============= GRADE SCALE CRUD =============
  
  getAllGradeScales(): Observable<GradeScale[]> {
    return this.http.get<GradeScale[]>(`${this.apiUrl}/GradeScales`);
  }

  getGradeScaleById(gradeId: number): Observable<GradeScale> {
    return this.http.get<GradeScale>(`${this.apiUrl}/GradeScales/${gradeId}`);
  }

  addGradeScale(grade: GradeScale): Observable<GradeScale> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<GradeScale>(`${this.apiUrl}/GradeScales`, grade, { headers });
  }

  updateGradeScale(gradeId: number, grade: GradeScale): Observable<GradeScale> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<GradeScale>(`${this.apiUrl}/GradeScales/${gradeId}`, grade, { headers });
  }

  deleteGradeScale(gradeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/GradeScales/${gradeId}`);
  }

  applyGradeScale(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/GradeScales/apply`, {});
  }

  // ============= EXAM RESULTS =============
  
  getResultsByExam(examId: number, classId?: number, sectionId?: number): Observable<ExamResult[]> {
    let url = `${this.apiUrl}/Results/exam/${examId}`;
    const params = [];
    if (classId) params.push(`classId=${classId}`);
    if (sectionId) params.push(`sectionId=${sectionId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<ExamResult[]>(url);
  }

  getResultByStudent(studentId: number, examId: number): Observable<ExamResult> {
    return this.http.get<ExamResult>(`${this.apiUrl}/Results/student/${studentId}/exam/${examId}`);
  }

  generateResults(examId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Results/generate/${examId}`, {});
  }

  exportResultsPDF(examId: number, classId?: number, sectionId?: number): Observable<Blob> {
    let url = `${this.apiUrl}/Results/export/pdf/${examId}`;
    const params = [];
    if (classId) params.push(`classId=${classId}`);
    if (sectionId) params.push(`sectionId=${sectionId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // ============= EXAM ANALYTICS =============
  
  getExamAnalytics(examId: number, classId?: number, sectionId?: number): Observable<ExamAnalytics> {
    let url = `${this.apiUrl}/Analytics/exam/${examId}`;
    const params = [];
    if (classId) params.push(`classId=${classId}`);
    if (sectionId) params.push(`sectionId=${sectionId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<ExamAnalytics>(url);
  }

  // ============= UTILITY METHODS =============
  
  calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  calculatePercentage(obtainedMarks: number, totalMarks: number): number {
    if (totalMarks === 0) return 0;
    return Math.round((obtainedMarks / totalMarks) * 100 * 100) / 100;
  }

  determineStatus(percentage: number): 'Pass' | 'Fail' {
    return percentage >= 50 ? 'Pass' : 'Fail';
  }
}