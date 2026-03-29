import { Component, OnInit, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, NgForm, FormsModule } from '@angular/forms';
import Swal from '../../../swal';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';


import { Router } from '@angular/router';
import { GradesSystem, MarksEntry, PassFailStatus, StudentMarksDetails } from '../../../Models/marks-entry';
import { ExamScheduleVm } from '../../../Models/exam-schedule-vm';
import { Staff } from '../../../Models/staff';
import { Examtype } from '../../../Models/examtype';
import { Subject } from '../../../Models/subject';
import { Standard } from '../../../Models/standard';
import { Student } from '../../../Models/student';
import { MarkEntryService } from '../../../services/marks-entry.service';
import { StaffService } from '../../../services/staff.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StudentService } from '../../../services/student.service';
import { ExamScheduleService } from '../../../services/exam-schedule.service';
import { ExamtypeService } from '../../../services/examtype.service';
import { SubjectService } from '../../../services/subject.service';
import { StandardService } from '../../../services/standard.service';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { ExamSchedule } from '../../../Models/exam-schedule';
import { CommonModule, NgForOf } from "@angular/common";
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-mark-entry',
  templateUrl: './marks-entry.component.html',
  styleUrl: './marks-entry.component.css',
  standalone: true,
  imports: [FormsModule, NgForOf, CommonModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MarksEntryComponent implements OnInit {
  title = 'Marks Entry';

  @ViewChild("entryForm") entryForm!: NgForm;
  //@ViewChild("LoadData") LoadData!: HTMLElement;

  markEntry: MarksEntry = new MarksEntry();

  //studentMarksDetails: StudentMarksDetails[] = [];

  staffList: Staff[] = [];

  examSchedules: ExamSchedule = new ExamSchedule();

  examtypes: Examtype[] = [];

  subjects: Subject[] = [];

  standards: Standard[] = [];

  students: Student[] = [];


  examSchedulesVM: ExamScheduleVm[] = [];

  // Define a property to hold enum values for the select dropdown
  gradesSystemValues = Object.keys(GradesSystem).filter(key => isNaN(+key));
  passFailStatusValues = Object.values(PassFailStatus);

  loading: boolean = false;
  isProcessing: boolean = false;


  constructor(
    private fb: FormBuilder,
    private markEntryService: MarkEntryService,
    private staffService: StaffService,
    private studentService: StudentService,
    private examScheduleService: ExamScheduleService,
    private examtypeService: ExamtypeService,
    private subjectService: SubjectService,
    private standardService: StandardService,
    private assignmentService: SubjectAssignmentService,
    private router: Router,
    public authService: AuthService,
    private popup: PopupService) { }

  ngOnInit(): void {
    this.initializeForm();

    this.examScheduleService.GetExamSchedules().subscribe((depts: ExamScheduleVm[]) => this.examSchedulesVM = depts);
    this.examtypeService.GetdbsExamType().subscribe((types: Examtype[]) => this.examtypes = types);

    const currentUser = this.authService.userValue;
    const roles: string[] = this.authService.roles || [];
    const isTeacher = roles.some(r => r.toLowerCase() === 'teacher');

    console.log("Current User: ", currentUser);
    console.log("Roles: ", roles, " | isTeacher: ", isTeacher);

    if (isTeacher && currentUser?.email) {
      // For Teachers, get their StaffId via email, then load their assignments
      this.staffService.getStaffByEmail(currentUser.email).subscribe({
        next: (staff: Staff) => {
          this.staffList = [staff]; // Teachers can only select themselves
          this.markEntry.staffId = staff.staffId; // Auto-select

          this.loadTeacherAssignments(staff.staffId);
        },
        error: (err) => {
          console.error("Could not fetch staff profile for the logged in teacher.", err);
          // Fallback or handle error
        }
      });
    } else {
      // For Admins/others, load all data
      this.standardService.getStandards().subscribe((stds: Standard[]) => this.standards = stds);
      this.staffService.getAllStaffs().subscribe((staffs: Staff[]) => this.staffList = staffs);
      this.subjectService.getSubjects().subscribe((subs: Subject[]) => this.subjects = subs);
    }
  }

  loadTeacherAssignments(staffId: number): void {
    this.assignmentService.getAssignmentsByTeacher(staffId).subscribe({
      next: (assignments: SubjectAssignment[]) => {
        // Extract unique Standards
        const uniqueStandards = new Map<number, Standard>();
        // Extract unique Subjects
        const uniqueSubjects = new Map<number, Subject>();

        assignments.forEach(a => {
          if (a.section && a.section.standard) {
            uniqueStandards.set(a.section.standard.standardId, a.section.standard);
          } else if (a.subject && a.subject.standard) {
            uniqueStandards.set(a.subject.standard.standardId, a.subject.standard);
          } else if (a.section && a.section.className) {
            // Fallback for cases where standard object might not be fully populated
            // but className is available. This assumes standardName matches className.
            const placeholderStandard: any = {
              standardId: a.section.standardId || a.subject?.standardId,
              standardName: a.section.className
            };
            if (placeholderStandard.standardId) {
              uniqueStandards.set(placeholderStandard.standardId, placeholderStandard);
            }
          }

          if (a.subject) {
            uniqueSubjects.set(a.subject.subjectId, a.subject);
          }
        });

        this.standards = Array.from(uniqueStandards.values());
        this.subjects = Array.from(uniqueSubjects.values());
      },
      error: (err) => console.error("Failed to load teacher assignments", err)
    });
  }

  onSubmit(): void {
    if (this.entryForm.valid) {
      this.popup.loading('Saving student marks...');
      this.loading = true;
      this.isProcessing = true;

      this.markEntryService.createMarkEntry(this.markEntry).pipe(
        finalize(() => {
          this.loading = false;
          this.isProcessing = false;
          this.popup.closeLoading();
        })
      ).subscribe({
        next: (response) => {
          this.popup.success('Success!', 'Student grades have been successfully recorded.');
          this.entryForm.resetForm();
          setTimeout(() => this.router.navigate(['/marksentrynewList']), 1500);
        },
        error: (error) => {
          console.error('Error creating Mark Entry:', error);
          this.popup.error('Update Failed', 'Failed to save student grades. Please check your connection and try again.');
        }
      });
    }
  }

  // Feedback handled by PopupService

  onFilterChange(): void {
    this.markEntry.studentMarksDetails = [];
  }

  initializeForm(): void {

  }



  loadStudentsMark(): void {
    if (!this.markEntry.standardId || !this.markEntry.subjectId) return;

    this.popup.loading('Fetching enrollment list...');
    this.loading = true;

    this.markEntryService.GetStudents(this.markEntry).pipe(
      finalize(() => {
        this.loading = false;
        this.popup.closeLoading();
      })
    ).subscribe({
      next: (students) => {
        this.markEntry.studentMarksDetails = students || [];
        if (!students || students.length === 0) {
          this.popup.warning('No Records Found', 'No students were found matching the selected criteria. Please check your filters.');
        }
      },
      error: (error) => {
        console.error('Error fetching students:', error);
        this.popup.error('Fetch Failed', 'Could not retrieve the student list. Please try again.');
      }
    });
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
}


