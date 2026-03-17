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

  /** PREMIUM UI STATES */
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  constructor(
    private attendanceService: AttendanceService,
    private standardService: StandardService,
    private authService: AuthService,
    private staffService: StaffService,
    private sectionService: SectionService,
    private subjectAssignmentService: SubjectAssignmentService
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
      next: (data) => this.classes = data,
      error: (err) => {
        console.error('Error loading classes', err);
        this.triggerError('Error', 'Unable to load classes');
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
      },
      error: (err) => {
        console.error('Error loading filtered classes', err);
        this.triggerError('Error', 'Unable to load filtered classes');
        this.loadAllClasses();
      }
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
        this.triggerError('Error', 'Unable to load the attendance report.');
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
