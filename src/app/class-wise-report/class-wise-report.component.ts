import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

interface ClassAttendanceReport {
  className: string;
  section: string;
  totalStudents: number;
  present: number;
  absent: number;
  leave: number;
  late: number;
  unmarked: number;
  attendanceMarked: boolean;
  percentage: number;
}

@Component({
  selector: 'app-class-wise-report',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './class-wise-report.component.html',
  styleUrls: ['./class-wise-report.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClassWiseReportComponent implements OnInit {
  title = 'Class-wise Attendance Report';

  // Date Filter
  selectedDate: string = '';
  reportLoaded: boolean = false;

  // Class Reports
  classReports: ClassAttendanceReport[] = [];

  ngOnInit(): void {
    this.setTodayDate();
  }

  setTodayDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  loadReport(): void {
    if (!this.selectedDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Date',
        text: 'Please select a date to view the report.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    // Generate dummy class reports
    this.classReports = this.generateClassReports();
    this.reportLoaded = true;

    Swal.fire({
      icon: 'success',
      title: 'Report Loaded',
      text: `Attendance report for ${this.selectedDate} loaded successfully.`,
      timer: 1500,
      showConfirmButton: false
    });
  }

  generateClassReports(): ClassAttendanceReport[] {
    const classes = ['9', '10', '11', '12'];
    const sections = ['A', 'B', 'C', 'D'];
    const reports: ClassAttendanceReport[] = [];

    classes.forEach(className => {
      sections.forEach(section => {
        const totalStudents = Math.floor(Math.random() * 10) + 35; // 35-45 students
        const attendanceMarked = Math.random() > 0.2; // 80% chance attendance is marked
        
        let present = 0, absent = 0, leave = 0, late = 0, unmarked = 0;
        
        if (attendanceMarked) {
          present = Math.floor(Math.random() * 5) + (totalStudents - 8);
          absent = Math.floor(Math.random() * 3) + 1;
          leave = Math.floor(Math.random() * 2);
          late = Math.floor(Math.random() * 2);
          unmarked = totalStudents - (present + absent + leave + late);
          if (unmarked < 0) unmarked = 0;
        } else {
          unmarked = totalStudents;
        }

        const percentage = attendanceMarked ? Math.round((present / totalStudents) * 100) : 0;

        reports.push({
          className,
          section,
          totalStudents,
          present,
          absent,
          leave,
          late,
          unmarked,
          attendanceMarked,
          percentage
        });
      });
    });

    return reports;
  }

  get totalClasses(): number {
    return this.classReports.length;
  }

  get markedClasses(): number {
    return this.classReports.filter(r => r.attendanceMarked).length;
  }

  get unmarkedClasses(): number {
    return this.classReports.filter(r => !r.attendanceMarked).length;
  }

  get overallPercentage(): number {
    if (this.classReports.length === 0) return 0;
    const totalPresent = this.classReports.reduce((sum, r) => sum + r.present, 0);
    const totalStudents = this.classReports.reduce((sum, r) => sum + r.totalStudents, 0);
    return totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
  }

  getStatusBadgeClass(report: ClassAttendanceReport): string {
    if (!report.attendanceMarked) return 'bg-danger-50 text-danger-600';
    if (report.percentage >= 90) return 'bg-success-50 text-success-600';
    if (report.percentage >= 75) return 'bg-warning-50 text-warning-600';
    return 'bg-danger-50 text-danger-600';
  }

  getStatusText(report: ClassAttendanceReport): string {
    if (!report.attendanceMarked) return 'Not Marked';
    if (report.percentage >= 90) return 'Excellent';
    if (report.percentage >= 75) return 'Good';
    return 'Poor';
  }
}
