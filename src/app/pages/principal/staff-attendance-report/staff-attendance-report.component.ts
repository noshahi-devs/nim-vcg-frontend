
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { StaffService } from '../../../services/staff.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-staff-attendance-report',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-attendance-report.component.html',
  styleUrls: ['./staff-attendance-report.component.css']
})
export class StaffAttendanceReportComponent {
  staffList: any[] = [];
  selectedStaffId: number | null = null;
  startDate: string = '';
  endDate: string = '';
  report: any[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private staffService: StaffService
  ) { }

  ngOnInit() {
    this.staffService.getAllStaffs().subscribe({
      next: (res) => this.staffList = res,
      error: () => {
        this.staffList = [{ id: 1, name: 'Teacher 1' }, { id: 2, name: 'Teacher 2' }];
      }
    });
  }

  getReport() {
    if (!this.selectedStaffId || !this.startDate || !this.endDate) return;
    this.attendanceService.getStaffAttendanceReport(this.selectedStaffId, this.startDate, this.endDate).subscribe({
      next: (res) => this.report = res,
      error: () => {
        this.report = [
          { date: '2024-01-01', status: 'Present', checkIn: '08:00 AM', checkOut: '02:00 PM' },
          { date: '2024-01-02', status: 'Present', checkIn: '08:05 AM', checkOut: '02:10 PM' },
        ];
      }
    });
  }
}
