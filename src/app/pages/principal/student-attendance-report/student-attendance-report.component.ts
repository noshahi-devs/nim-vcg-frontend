
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-attendance-report',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule],
  templateUrl: './student-attendance-report.component.html',
  styleUrls: ['./student-attendance-report.component.css']
})
export class StudentAttendanceReportComponent {
  studentId: number | null = null;
  startDate: string = '';
  endDate: string = '';
  report: any[] = [];

  constructor(private attendanceService: AttendanceService) { }

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
