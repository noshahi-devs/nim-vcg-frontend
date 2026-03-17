
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { StudentService } from '../../../services/student.service';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { Student } from '../../../Models/student';
import { SessionService } from '../../../services/session.service';

@Component({
  selector: 'app-student-attendance-report',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './student-attendance-report.component.html',
  styleUrls: ['./student-attendance-report.component.css']
})
export class StudentAttendanceReportComponent implements OnInit {
  studentId: number | null = null;
  startDate: string = '';
  endDate: string = '';
  report: any[] = [];
  students: Student[] = [];
  searchTerm: string = '';
  showDropdown: boolean = false;

  /** PREMIUM UI STATES */
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private sessionService: SessionService,
    private eRef: ElementRef
  ) { }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  get filteredStudents(): Student[] {
    if (!this.searchTerm) return this.students;
    return this.students.filter(s =>
      s.studentName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadStudents(): void {
    const yearId = this.sessionService.getCurrentYearId();
    this.studentService.GetStudents(yearId).subscribe({
      next: (res) => {
        this.students = res;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.triggerError('Error', 'Unable to load students.');
      }
    });
  }

  selectStudent(s: Student): void {
    this.studentId = s.studentId;
    this.searchTerm = s.studentName;
    this.showDropdown = false;
  }

  onSearchChange(): void {
    this.showDropdown = true;
    this.studentId = null; // Reset ID if user is typing manually
  }

  getReport() {
    if (!this.studentId || !this.startDate || !this.endDate) return;
    this.isProcessing = true;
    this.attendanceService.getStudentAttendanceReport(this.studentId, this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.report = res;
        this.isProcessing = false;
      },
      error: () => {
        this.isProcessing = false;
        this.report = [];
        this.triggerError('Error', 'Failed to fetch attendance records.');
      }
    });
  }

  // Helper Methods for Modals
  triggerSuccess(title: string, message: string) {
    this.feedbackType = 'success';
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  triggerError(title: string, message: string) {
    this.feedbackType = 'error';
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  triggerWarning(title: string, message: string) {
    this.feedbackType = 'warning';
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }
}
