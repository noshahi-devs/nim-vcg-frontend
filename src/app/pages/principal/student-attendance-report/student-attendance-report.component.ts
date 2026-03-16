
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
      next: (res) => this.students = res,
      error: (err) => console.error('Error loading students:', err)
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
    this.attendanceService.getStudentAttendanceReport(this.studentId, this.startDate, this.endDate).subscribe({
      next: (res) => this.report = res,
      error: () => {
        // Dummy
        this.report = [
          { date: '2024-01-01', status: 'Present' },
          { date: '2024-01-02', status: 'Present' },
          { date: '2024-01-03', status: 'Absent', remarks: 'Sick' },
        ];
      }
    });
  }
}
