import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AttendanceService } from '../../../services/attendance.service';
import { StandardService } from '../../../services/standard.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AttendanceComponent implements OnInit {

  title = 'Student Attendance';

  /** FILTER */
  selectedClass = '';
  selectedDate = '';

  /** STANDARDS & STUDENTS */
  standards: Standard[] = [];
  students: Student[] = [];
  studentsLoaded = false;

  constructor(
    private standardService: StandardService,
    private attendanceService: AttendanceService
  ) { }

  ngOnInit(): void {
    this.setTodayDate();
    this.loadStandards();
  }

  setTodayDate(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  /** ==========================
   * LOAD STANDARDS
   * ========================== */
  loadStandards(): void {
    this.standardService.getStandards().subscribe({
      next: (data: Standard[]) => {
        this.standards = data || [];
      },
      error: () => {
        Swal.fire('Error', 'Could not load standards', 'error');
        this.standards = [];
      }
    });
  }

  /** ==========================
   * LOAD STUDENTS BASED ON SELECTED STANDARD
   * ========================== */
  loadStudents(): void {
    if (!this.selectedClass) {
      Swal.fire('Missing Filter', 'Please select a Standard', 'warning');
      return;
    }

    // Find the selected standard
    const std = this.standards.find(s => s.standardName === this.selectedClass);
    if (!std || !std.students) {
      this.students = [];
      this.studentsLoaded = true;
      return;
    }

    // Students of this standard
    this.students = std.students;
    this.studentsLoaded = true;
  }

  /** ==========================
   * MARK ATTENDANCE
   * ========================== */
  markAllPresent(): void {
    this.students.forEach(s => s.status = 'Present');
  }

  markAllAbsent(): void {
    this.students.forEach(s => s.status = 'Absent');
  }

  /** ==========================
   * SAVE ATTENDANCE
   * ========================== */
  async saveAttendance(): Promise<void> {
    const unmarked = this.students.filter(s => !s.status);
    if (unmarked.length) {
      const res = await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Attendance',
        text: `${unmarked.length} students not marked. Continue?`,
        showCancelButton: true,
        confirmButtonText: 'Save'
      });
      if (!res.isConfirmed) return;
    }

    this.students.forEach(s => {
      this.attendanceService.addAttendance({
        attendanceId: 0,
        date: new Date(this.selectedDate),
        type: 0,
        attendanceIdentificationNumber: s.studentId,
        description: '',
        isPresent: s.status === 'Present'
      }).subscribe();
    });

    Swal.fire('Saved!', 'Attendance saved successfully', 'success');
    this.resetForm();
  }

  resetForm(): void {
    this.students = [];
    this.studentsLoaded = false;
    this.selectedClass = '';
    this.setTodayDate();
  }
}
