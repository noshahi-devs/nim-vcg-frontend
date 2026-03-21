
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { StaffService } from '../../../services/staff.service';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-staff-attendance-report',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './staff-attendance-report.component.html',
  styleUrls: ['./staff-attendance-report.component.css']
})
export class StaffAttendanceReportComponent implements OnInit {
  staffList: any[] = [];
  selectedStaffId: number | null = null;
  startDate: string = '';
  endDate: string = '';
  report: any[] = [];
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
    private staffService: StaffService,
    private eRef: ElementRef
  ) { }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  ngOnInit() {
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        this.staffList = res;
      },
      error: (err) => {
        console.error('Error loading staff members:', err);
        this.triggerError('Error', 'Unable to load staff members.');
      }
    });
  }

  get filteredStaff(): any[] {
    if (!this.searchTerm) return this.staffList;
    const term = this.searchTerm.toLowerCase();
    return this.staffList.filter(s =>
      (s.staffName && s.staffName.toLowerCase().includes(term)) ||
      (s.staffId && s.staffId.toString().includes(term))
    );
  }

  selectStaff(s: any): void {
    this.selectedStaffId = s.staffId;
    this.searchTerm = s.staffName;
    this.showDropdown = false;
  }

  onSearchChange(): void {
    this.showDropdown = true;
    this.selectedStaffId = null;
  }

  getReport() {
    if (!this.selectedStaffId || !this.startDate || !this.endDate) return;
    
    this.isProcessing = true;
    // Using manual fetch and filter because the report endpoint seems to strip checkout times
    this.attendanceService.getAttendances().subscribe({
      next: (data: any[]) => {
        const start = new Date(this.startDate).getTime();
        const end = new Date(this.endDate).getTime();
        
        this.report = data.filter(a => {
          const aDate = new Date(a.date).getTime();
          const isStaff = a.type == 1 || a.type === 'Staff';
          const isCorrectStaff = a.attendanceIdentificationNumber == this.selectedStaffId;
          const isInRange = aDate >= start && aDate <= (end + 86400000); // include full end day
          
          return isStaff && isCorrectStaff && isInRange;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        this.isProcessing = false;
      },
      error: () => {
        this.isProcessing = false;
        this.report = [];
        this.triggerError('Error', 'Failed to fetch attendance records.');
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
    XLSX.writeFile(workbook, `Staff_Attendance_${this.searchTerm}_${this.startDate}.xlsx`);
  }

  exportPdf(): void {
    if (!this.report.length) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Staff Attendance Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Staff: ${this.searchTerm} | Date: ${this.startDate} to ${this.endDate}`, 14, 30);
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
    doc.save(`Staff_Attendance_${this.searchTerm}_${this.startDate}.pdf`);
  }

  printReport(): void {
    if (!this.report.length) return;
    const rows = this.report.map(r => `
      <tr>
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td>${(r.isPresent || r.status === 'Present') ? 'Present' : (r.status || 'Absent')}</td>
        <td>${new Date(r.date).toLocaleTimeString() || '--:--'}</td>
        <td>${r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '--:--'}</td>
      </tr>`).join('');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Staff Attendance Report – ${this.searchTerm}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #800000; margin-bottom: 4px; }
          p { color: #555; margin-top: 0; font-size: 13px; }
          table { width:100%; border-collapse:collapse; margin-top:16px; }
          th { background:#800000; color:#fff; padding:10px 12px; text-align:left; font-size:12px; }
          td { padding:9px 12px; border-bottom:1px solid #e2e8f0; font-size:12px; }
          tr:nth-child(even) td { background:#f8fafc; }
        </style>
      </head>
      <body>
        <h2>Staff Attendance Report</h2>
        <p>Staff: ${this.searchTerm} &nbsp;|&nbsp; Period: ${this.startDate} to ${this.endDate}</p>
        <table>
          <thead><tr><th>Date</th><th>Status</th><th>Check-In</th><th>Check-Out</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); }
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
