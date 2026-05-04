
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { StudentService } from '../../../services/student.service';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { Student } from '../../../Models/student';
import { SessionService } from '../../../services/session.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PopupService } from '../../../services/popup.service';

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

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private sessionService: SessionService,
    private eRef: ElementRef,
    private popup: PopupService
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
    const term = this.searchTerm.toLowerCase();
    return this.students.filter(s =>
      (s.studentName && s.studentName.toLowerCase().includes(term)) ||
      (s.studentId && s.studentId.toString().includes(term)) ||
      (s.enrollmentNo && s.enrollmentNo.toString().toLowerCase().includes(term))
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
        this.popup.error('Error', 'Unable to load students.');
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
    this.popup.loading('Fetching analytic report...');
    this.attendanceService.getStudentAttendanceReport(this.studentId, this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.report = res;
        this.isProcessing = false;
      },
      error: () => {
        this.isProcessing = false;
        this.report = [];
        this.popup.error('Error', 'Failed to fetch attendance records.');
      }
    });
  }

  exportExcel(): void {
    if (!this.report.length) return;
    const worksheet = XLSX.utils.json_to_sheet(this.report.map(r => ({
      'Date': new Date(r.date).toLocaleDateString(),
      'Status': r.status || 'Unmarked',
      'Check-in Time': r.checkInTime || '---',
      'Check-out Time': r.checkOutTime || '---'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `Student_Attendance_${this.searchTerm}_${this.startDate}.xlsx`);
  }

  exportPdf(): void {
    if (!this.report.length) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Student Attendance Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Student: ${this.searchTerm} | Date: ${this.startDate} to ${this.endDate}`, 14, 30);
    const tableData = this.report.map(r => [
      new Date(r.date).toLocaleDateString(),
      r.status || 'Unmarked',
      r.checkInTime || '---',
      r.checkOutTime || '---'
    ]);
    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Status', 'Check-in Time', 'Check-out Time']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [128, 0, 0] }
    });
    doc.save(`Student_Attendance_${this.searchTerm}_${this.startDate}.pdf`);
  }

  printReport(): void {
    if (!this.report.length) return;
    const rows = this.report.map(r => `
      <tr>
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td>${new Date(r.date).toLocaleDateString('en-US', {weekday:'long'})}</td>
        <td>${r.status || 'Unmarked'}</td>
        <td>${r.remarks || 'No remarks provided'}</td>
      </tr>`).join('');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Attendance Report – ${this.searchTerm}</title>
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
        <h2>Student Attendance Report</h2>
        <p>Student: ${this.searchTerm} &nbsp;|&nbsp; Period: ${this.startDate} to ${this.endDate}</p>
        <table>
          <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Remarks</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); }
  }

  closeFeedback() {
    // legacy
  }
}
