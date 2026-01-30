// import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Attendance } from '../Models/attendance';
// import { Student } from '../Models/student';
// import { StudentService } from '../services/student.service';
// import { AttendanceService } from '../services/attendance.service';

// @Component({
//   selector: 'app-class-wise-report',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './class-wise-report.component.html',
//   styleUrls: ['./class-wise-report.component.css'],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA] // ✅ Needed for iconify-icon
// })
// export class ClassWiseReportComponent implements OnInit {

//   title = 'Class-wise Attendance Report';
//   selectedDate!: string;

//   students: Student[] = [];
//   attendanceList: Attendance[] = [];

//   reportLoaded = false;
//   classReports: any[] = [];

//   totalClasses = 0;
//   markedClasses = 0;
//   unmarkedClasses = 0;
//   overallPercentage = 0;

//   constructor(
//     private studentService: StudentService,
//     private attendanceService: AttendanceService
//   ) {}

//   ngOnInit(): void {
//     this.loadStudents();
//     this.loadAttendance();
//   }

//   loadStudents() {
//     this.studentService.GetStudents().subscribe((res: any) => {
//       this.students = res;
//     });
//   }

//   loadAttendance() {
//     this.attendanceService.getAttendances().subscribe((res: any) => {
//       this.attendanceList = res;
//     });
//   }

//   loadReport() {
//     if (!this.selectedDate) return;

//     // Group students by class and section
//     const classesMap: { [key: string]: any } = {};

//     this.students.forEach((student: any) => {
//       const classKey = `${student.standard?.standardName || 'N/A'}-${student.standard || 'N/A'}`;

//       if (!classesMap[classKey]) {
//         classesMap[classKey] = {
//           standardName: student.standard?.standardName || 'N/A',
//           section: student.section || 'N/A',
//           totalStudents: 0,
//           present: 0,
//           absent: 0,
//           leave: 0,
//           late: 0,
//           unmarked: 0,
//           attendanceMarked: false
//         };
//       }

//       classesMap[classKey].totalStudents += 1;

//       // Filter attendance for this student
//       const studentAttendance = this.attendanceList.filter((a: any) =>
//         a.studentId === student.studentId &&
//         new Date(a.date).toISOString().split('T')[0] === this.selectedDate
//       );

//       if (studentAttendance.length > 0) {
//         classesMap[classKey].attendanceMarked = true;
//         studentAttendance.forEach((att: any) => {
//           if (att.status === 'Present') classesMap[classKey].present += 1;
//           else if (att.status === 'Absent') classesMap[classKey].absent += 1;
//           else if (att.status === 'Leave') classesMap[classKey].leave += 1;
//           else if (att.status === 'Late') classesMap[classKey].late += 1;
//         });
//         classesMap[classKey].unmarked = classesMap[classKey].totalStudents - studentAttendance.length;
//       } else {
//         classesMap[classKey].unmarked = classesMap[classKey].totalStudents;
//       }

//       classesMap[classKey].percentage = classesMap[classKey].attendanceMarked
//         ? Math.round((classesMap[classKey].present / classesMap[classKey].totalStudents) * 100)
//         : 0;
//     });

//     this.classReports = Object.values(classesMap);
//     this.reportLoaded = true;

//     // Summary stats
//     this.totalClasses = this.classReports.length;
//     this.markedClasses = this.classReports.filter(c => c.attendanceMarked).length;
//     this.unmarkedClasses = this.classReports.filter(c => !c.attendanceMarked).length;

//     // Overall attendance
//     let totalPresent = 0;
//     let totalStudents = 0;
//     this.classReports.forEach(c => {
//       totalPresent += c.present;
//       totalStudents += c.totalStudents;
//     });
//     this.overallPercentage = totalStudents ? Math.round((totalPresent / totalStudents) * 100) : 0;
//   }

//   getStatusBadgeClass(report: any): string {
//     if (!report.attendanceMarked) return 'bg-secondary';
//     if (report.percentage >= 90) return 'bg-success';
//     if (report.percentage >= 75) return 'bg-warning';
//     return 'bg-danger';
//   }

//   getStatusText(report: any): string {
//     if (!report.attendanceMarked) return 'Not Marked';
//     if (report.percentage >= 90) return 'Good';
//     if (report.percentage >= 75) return 'Average';
//     return 'Poor';
//   }
// }


import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Standard } from '../../../Models/standard';
import { Student } from '../../../Models/student';
import { Attendance } from '../../../Models/attendance';
import { StandardService } from '../../../services/standard.service';
import { StudentService } from '../../../services/student.service';
import { AttendanceService } from '../../../services/attendance.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-class-wise-report',
  standalone: true,
  templateUrl: './class-wise-report.component.html',
  styleUrls: ['./class-wise-report.component.css'],
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClassWiseReportComponent implements OnInit {
  title = 'Class Wise Report';
  selectedDate!: string;
  selectedStandardId!: string;
  standards: Standard[] = [];
  students: Student[] = [];
  attendanceList: Attendance[] = [];
  classReports: any[] = [];
  reportLoaded = false;

  // Summary stats
  totalClasses = 0;
  markedClasses = 0;
  unmarkedClasses = 0;
  overallPercentage = 0;

  summaryStats: any[] = [];

  constructor(
    private standardService: StandardService,
    private studentService: StudentService,
    private attendanceService: AttendanceService
  ) { }

  ngOnInit(): void {
    this.loadStandards();
    this.loadStudents();
    this.loadAttendance();
  }

  loadStandards() {
    this.standardService.getStandards().subscribe({
      next: res => this.standards = res,
      error: err => console.error('Standards API error:', err)
    });
  }

  loadStudents() {
    this.studentService.GetStudents().subscribe({
      next: res => this.students = res,
      error: err => console.error('Students API error:', err)
    });
  }

  loadAttendance() {
    this.attendanceService.getAttendances().subscribe({
      next: res => this.attendanceList = res,
      error: err => console.error('Attendance API error:', err)
    });
  }

  loadReport() {
    if (!this.selectedDate) return;

    // 1. Filter students by selected standard
    const filteredStudents = this.students.filter(s =>
      !this.selectedStandardId || s.standard?.standardId === +this.selectedStandardId
    );

    const classesMap: { [key: string]: any } = {};

    filteredStudents.forEach(student => {
      const classKey = `${student.standard?.standardName || 'N/A'}-${student.section}`;

      if (!classesMap[classKey]) {
        classesMap[classKey] = {
          standardName: student.standard?.standardName || 'N/A',
          section: student.section,
          totalStudents: 0,
          present: 0,
          absent: 0,
          leave: 0,
          late: 0,
          unmarked: 0,
          attendanceMarked: false,
          percentage: 0
        };
      }

      classesMap[classKey].totalStudents += 1;

      // 2. Map attendance using attendanceIdentificationNumber
      const studentAttendance = this.attendanceList.filter(a =>
        a.attendanceIdentificationNumber === student.enrollmentNo &&
        new Date(a.date).toISOString().split('T')[0] === this.selectedDate
      );

      if (studentAttendance.length > 0) {
        classesMap[classKey].attendanceMarked = true;

        studentAttendance.forEach(att => {
          if (att.isPresent) classesMap[classKey].present += 1;
          else classesMap[classKey].absent += 1;
        });

        classesMap[classKey].unmarked = classesMap[classKey].totalStudents - studentAttendance.length;
      } else {
        classesMap[classKey].unmarked = classesMap[classKey].totalStudents;
      }

      // 3. Attendance %
      classesMap[classKey].percentage = classesMap[classKey].attendanceMarked
        ? Math.round((classesMap[classKey].present / classesMap[classKey].totalStudents) * 100)
        : 0;
    });

    // 4. Filter by selected standardName
    this.classReports = Object.values(classesMap).filter(c =>
      !this.selectedStandardId || c.standardName === this.standards.find(s => s.standardId === +this.selectedStandardId)?.standardName
    );

    this.reportLoaded = true;

    // 5. Summary
    this.totalClasses = this.classReports.length;
    this.markedClasses = this.classReports.filter(c => c.attendanceMarked).length;
    this.unmarkedClasses = this.classReports.filter(c => !c.attendanceMarked).length;

    let totalPresent = 0;
    let totalStudents = 0;
    this.classReports.forEach(c => {
      totalPresent += c.present;
      totalStudents += c.totalStudents;
    });
    this.overallPercentage = totalStudents ? Math.round((totalPresent / totalStudents) * 100) : 0;

    // 6. Summary stats for cards
    this.summaryStats = [
      { label: 'Total Classes', value: this.totalClasses, icon: 'mdi:google-classroom', bgClass: 'bg-primary-50', textClass: 'text-primary-600' },
      { label: 'Marked', value: this.markedClasses, icon: 'mdi:check-circle', bgClass: 'bg-success-50', textClass: 'text-success-600' },
      { label: 'Not Marked', value: this.unmarkedClasses, icon: 'mdi:alert-circle', bgClass: 'bg-danger-50', textClass: 'text-danger-600' },
      { label: 'Overall Attendance', value: this.overallPercentage + '%', icon: 'mdi:chart-line', bgClass: 'bg-warning-50', textClass: 'text-warning-600' }
    ];
  }


  getStatusText(report: any) {
    return report.attendanceMarked ? 'Marked' : 'Not Marked';
  }

  getStatusBadgeClass(report: any) {
    return report.attendanceMarked ? 'badge-success' : 'badge-danger';
  }

  // For status colors in cards
  statusBgClass(status: string) {
    return {
      present: 'bg-success-50',
      absent: 'bg-danger-50',
      leave: 'bg-warning-50',
      late: 'bg-info-50'
    }[status] + ' radius-8 p-2';
  }

  statusTextClass(status: string) {
    return {
      present: 'text-success-600',
      absent: 'text-danger-600',
      leave: 'text-warning-600',
      late: 'text-info-600'
    }[status];
  }

  capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
