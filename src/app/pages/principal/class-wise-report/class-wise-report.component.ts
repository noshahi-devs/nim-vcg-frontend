import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { StandardService } from '../../../services/standard.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SectionService } from '../../../services/section.service';
import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { forkJoin } from 'rxjs';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-class-wise-report',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent],
  templateUrl: './class-wise-report.component.html',
  styleUrls: ['./class-wise-report.component.css']
})
export class ClassWiseReportComponent implements OnInit {
  title = 'Class Attendance Report';
  classes: any[] = [];
  selectedClassId: number | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];
  reportData: any[] = [];
  isLoading = false;

  /** PAGINATION */
  Math = Math;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50, 100];

  constructor(
    private attendanceService: AttendanceService,
    private standardService: StandardService,
    private authService: AuthService,
    private staffService: StaffService,
    private sectionService: SectionService,
    private subjectAssignmentService: SubjectAssignmentService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    const isTeacher = this.authService.hasAnyRole(['Teacher']);
    const currentUser = this.authService.userValue;

    if (isTeacher && currentUser?.email) {
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) {
            this.loadFilteredClasses(staff.staffId);
          } else {
            this.loadAllClasses();
          }
        },
        error: () => this.loadAllClasses()
      });
    } else {
      this.loadAllClasses();
    }
  }

  private loadAllClasses(): void {
    this.standardService.getStandards().subscribe({
      next: (data) => {
        this.classes = data;
        this.setDefaultClass();
      },
      error: (err) => {
        console.error('Error loading classes', err);
        this.popup.error('Error', 'Unable to load classes');
      }
    });
  }

  private loadFilteredClasses(staffId: number): void {
    forkJoin({
      standards: this.standardService.getStandards(),
      sections: this.sectionService.getSections(),
      assignments: this.subjectAssignmentService.getAssignmentsByTeacher(staffId)
    }).subscribe({
      next: (res) => {
        // Teacher is interested in classes where they are a class teacher OR assigned a subject
        const assignedSectionClassNames = (res.sections || [])
          .filter(s => s.staffId === staffId)
          .map(s => s.className);

        const assignedSubjectClassNames = (res.assignments || [])
          .map(a => a.subject?.standard?.standardName)
          .filter(name => !!name);

        const allAssignedClassNames = new Set([...assignedSectionClassNames, ...assignedSubjectClassNames]);

        this.classes = res.standards.filter(s => allAssignedClassNames.has(s.standardName));
        this.setDefaultClass();
      },
      error: (err) => {
        console.error('Error loading filtered classes', err);
        this.popup.error('Error', 'Unable to load filtered classes');
        this.loadAllClasses();
      }
    });
  }

  setDefaultClass(): void {
    if (this.classes && this.classes.length > 0 && !this.selectedClassId) {
      this.selectedClassId = this.classes[0].standardId;
      this.loadReport();
    }
  }

  loadReport(): void {
    if (!this.selectedClassId) return;
    this.isLoading = true;
    this.attendanceService.getClassWiseAttendance(this.selectedClassId, this.selectedDate).subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading report', err);
        this.popup.error('Error', 'Unable to load the attendance report.');
        this.reportData = [];
        this.isLoading = false;
      }
    });
  }

  get summary() {
    return {
      present: this.reportData.filter(r => r.status === 'Present').length,
      absent: this.reportData.filter(r => r.status === 'Absent').length
    };
  }

  exportExcel(): void {
    if (!this.reportData.length) return;
    const worksheet = XLSX.utils.json_to_sheet(this.reportData.map(r => ({
      'Roll No': r.rollNo || 'N/A',
      'Student Name': r.studentName,
      'Status': r.status || 'Unmarked'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `Class_Attendance_${this.selectedDate}.xlsx`);
  }

  exportPdf(): void {
    if (!this.reportData.length) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Class Attendance Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${this.selectedDate}`, 14, 30);
    
    // Table
    const tableData = this.reportData.map(r => [
      r.rollNo || 'N/A',
      r.studentName,
      r.status || 'Unmarked'
    ]);
    
    autoTable(doc, {
      startY: 35,
      head: [['Roll No', 'Student Name', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [128, 0, 0] } // Maroon theme
    });
    
    doc.save(`Class_Attendance_${this.selectedDate}.pdf`);
  }

  printReport(): void {
    if (!this.reportData.length) return;
    const rows = this.reportData.map(r => `
      <tr>
        <td>${r.rollNo || 'N/A'}</td>
        <td>${r.studentName || ''}</td>
        <td>${r.status || 'Unmarked'}</td>
      </tr>`).join('');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Class Attendance Report – ${this.selectedDate}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: var(--primary-color); margin-bottom: 4px; }
          p { color: #555; margin-top: 0; font-size: 13px; }
          table { width:100%; border-collapse:collapse; margin-top:16px; }
          th { background:var(--primary-color); color:#fff; padding:10px 12px; text-align:left; font-size:12px; }
          td { padding:9px 12px; border-bottom:1px solid #e2e8f0; font-size:12px; }
          tr:nth-child(even) td { background:#f8fafc; }
        </style>
      </head>
      <body>
        <h2>Class Attendance Report</h2>
        <p>Date: ${this.selectedDate}</p>
        <table>
          <thead><tr><th>Roll No</th><th>Student Name</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); }
  }

  // Pagination Logic
  get totalPages(): number {
    return Math.ceil(this.reportData.length / this.pageSize) || 1;
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.reportData.slice(start, start + this.pageSize);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 1;
    let pages: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= delta + 2) {
        for (let i = 1; i <= 3 + delta * 2; i++) {
          if (i <= total) pages.push(i);
        }
        if (total > 3 + delta * 2) {
          pages.push('...');
          pages.push(total);
        }
      } else if (current >= total - delta - 1) {
        pages.push(1);
        pages.push('...');
        for (let i = total - (2 + delta * 2); i <= total; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - delta; i <= current + delta; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  }

  closeFeedback() {
    // legacy
  }
}
