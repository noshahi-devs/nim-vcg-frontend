import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AttendanceService } from '../../../services/attendance.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StandardService } from '../../../services/standard.service';
import { StaffService } from '../../../services/staff.service';
import { SectionService } from '../../../services/section.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { PopupService } from '../../../services/popup.service';

import { finalize, forkJoin } from 'rxjs';


@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
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
  students: any[] = [];
  loading = false;

  /** PERMISSIONS */
  canMarkAttendance = false;

  /** PREMIUM UI STATES */
  isProcessing = false;
  pendingRecords: any[] = [];

  constructor(
    private standardService: StandardService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private staffService: StaffService,
    private sectionService: SectionService,
    private assignmentService: SubjectAssignmentService,
    private popup: PopupService
  ) { }


  ngOnInit(): void {
    this.setTodayDate();
    this.loadStandards();

    // Admin and Principal can purely view, only Teachers can mark
    this.canMarkAttendance = this.authService.hasRole('Teacher');
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  setTodayDate(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  formatStandardName(name: string): string {
    if (!name) return '';
    const numberMap: { [key: string]: string } = {
      'One': '1', 'Two': '2', 'Three': '3', 'Four': '4', 'Five': '5',
      'Six': '6', 'Seven': '7', 'Eight': '8', 'Nine': '9', 'Ten': '10'
    };
    let formatted = name;
    Object.keys(numberMap).forEach(word => {
      if (formatted.includes(word)) {
        formatted = formatted.replace(word, numberMap[word]);
      }
    });
    return formatted;
  }

  /** ==========================
   * LOAD STANDARDS
   * ========================== */
  loadStandards(): void {
    this.standardService.getStandards().subscribe({
      next: (data: Standard[]) => {
        const isTeacher = this.authService.hasAnyRole(['Teacher']);
        const currentUser = this.authService.userValue;

        if (isTeacher && currentUser?.email) {
          this.staffService.getAllStaffs().subscribe({
            next: (staffs) => {
              const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
              if (staff) {
                this.filterStandardsForTeacher(data, staff.staffId);
              } else {
                this.standards = data || [];
                this.setDefaultClass();
              }
            },
            error: () => {
              this.standards = data || [];
              this.setDefaultClass();
            }
          });
        } else {
          this.standards = data || [];
          this.setDefaultClass();
        }
      },
      error: () => {
        this.popup.error('Load Failed', 'Could not load standards');
        this.standards = [];
      }
    });
  }

  private filterStandardsForTeacher(allStandards: Standard[], staffId: number): void {
    forkJoin({
      sections: this.sectionService.getSections(),
      assignments: this.assignmentService.getAssignmentsByTeacher(staffId)
    }).subscribe({
      next: (result) => {
        const classTeacherSections = (result.sections || []).filter(s => s.staffId === staffId);
        const subjectAssignedClassNames = (result.assignments || [])
          .map(a => a.section?.className || a.subject?.standard?.standardName)
          .filter(name => !!name);

        const assignedClassNames = [
          ...new Set([
            ...classTeacherSections.map(s => s.className),
            ...subjectAssignedClassNames
          ])
        ];

        this.standards = (allStandards || []).filter(c => assignedClassNames.includes(c.standardName));
        this.setDefaultClass();
      },
      error: () => this.standards = allStandards || []
    });
  }


  setDefaultClass(): void {
    if (this.standards && this.standards.length > 0 && !this.selectedClass) {
      this.selectedClass = this.standards[0].standardName;
      this.loadStudents();
    }
  }

  /** ==========================
   * LOAD STUDENTS BASED ON SELECTED STANDARD
   * ========================== */
  loadStudents(): void {
    if (!this.selectedClass) {
      this.popup.warning('Missing Filter', 'Please select a Standard');
      return;
    }

    const std = this.standards.find(s => s.standardName === this.selectedClass);
    if (!std) return;

    this.loading = true;
    // Fetch existing attendance for this class and date
    this.attendanceService.getClassWiseAttendance(std.standardId, this.selectedDate).pipe(finalize(() => this.loading = false)).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // Map existing statuses, merging with original student data to retain Roll No
          this.students = data.map((record: any) => {
            const originalStudent = std.students?.find(s => s.studentId === record.studentId) || {};
            return {
              ...originalStudent,
              ...record,
              status: record.description === 'Leave' ? 'Leave' : record.status // Explicitly keep status for clarity
            };
          }) as any[];
        } else if (std.students) {
          // If no records, load from standard's student list
          this.students = std.students.map((s: any) => ({
            ...s,
            status: '' // Unmarked
          })) as any[];
        }
      },
      error: (err) => {
        console.error('Error fetching existing attendance', err);
        // Fallback to standard's student list if API fails
        if (std.students) {
          this.students = std.students;
        }
      }
    });
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
  saveAttendance(): void {
    const unmarked = this.students.filter(s => !s.status);
    
    this.pendingRecords = this.students.filter(s => s.status).map(s => {
      return this.attendanceService.addAttendance({
        attendanceId: 0,
        date: new Date(this.selectedDate),
        type: 0, // 0 for Student
        attendanceIdentificationNumber: s.studentId,
        description: s.status === 'Leave' ? 'Leave' : '',
        isPresent: s.status === 'Present'
      });
    });

    if (this.pendingRecords.length === 0) {
      this.popup.warning('No Data', 'No students to mark attendance for.');
      return;
    }

    if (unmarked.length) {
      this.popup.confirm(
        'Incomplete Attendance',
        'Some students have not been marked. Do you want to save the current records?',
        'Save Anyway',
        'Review'
      ).then(confirmed => {
        if (confirmed) this.confirmSave();
      });
    } else {
      this.confirmSave();
    }
  }

  confirmSave(): void {
    this.isProcessing = true;
    this.popup.loading('Saving attendance...');

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(this.pendingRecords).subscribe({
        next: () => {
          this.isProcessing = false;
          this.popup.success('Saved!', 'Attendance saved successfully');
          this.resetForm();
        },
        error: (err) => {
          console.error('Error saving attendance:', err);
          this.isProcessing = false;
          this.popup.error('Error', 'Failed to save attendance. Please try again.');
        }
      });
    });
  }

  resetForm(): void {
    this.students = [];
    this.loading = false;
    this.selectedClass = '';
    this.setTodayDate();
  }

  getStats() {
    return {
      present: this.students.filter(s => s.status === 'Present').length,
      absent: this.students.filter(s => s.status === 'Absent').length,
      leave: this.students.filter(s => s.status === 'Leave').length
    };
  }
}


