
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
      next: (res) => this.staffList = res,
      error: () => {
        this.staffList = [{ staffId: 1, staffName: 'Teacher 1' }, { staffId: 2, staffName: 'Teacher 2' }];
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
        
        console.log('Filtered Staff Data:', this.report);
      },
      error: () => {
        this.report = [
          { date: '2024-01-01', status: 'Present', checkIn: '08:00 AM', checkOut: '02:00 PM' },
          { date: '2024-01-02', status: 'Present', checkIn: '08:05 AM', checkOut: '02:10 PM' },
        ];
      }
    });
  }
}
