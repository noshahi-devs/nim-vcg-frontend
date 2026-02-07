import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { StandardService } from '../../../services/standard.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-class-wise-report',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './class-wise-report.component.html',
  styleUrls: ['./class-wise-report.component.css']
})
export class ClassWiseReportComponent implements OnInit {
  classes: any[] = [];
  selectedClassId: number | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];
  reportData: any[] = [];
  isLoading = false;

  constructor(
    private attendanceService: AttendanceService,
    private standardService: StandardService
  ) { }

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.standardService.getStandards().subscribe({
      next: (data) => this.classes = data,
      error: (err) => console.error('Error loading classes', err)
    });
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
}
