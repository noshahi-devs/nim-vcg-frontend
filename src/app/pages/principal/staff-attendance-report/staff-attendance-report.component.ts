
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { StaffService } from '../../../services/staff.service';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

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
    return this.staffList.filter(s =>
      s.staffName?.toLowerCase().includes(this.searchTerm.toLowerCase())
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
