import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StudentService } from '../../../services/student.service';
import { GenderList, Student } from '../../../Models/student';
import { ImageUpload } from '../../../Models/StaticImageModel/imageUpload';
import { StandardService } from '../../../services/standard.service';
import { Standard } from '../../../Models/standard';
import { OnInit } from '@angular/core';
import { SessionService } from '../../../services/session.service';
import { finalize } from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { Section } from '../../../Models/section';
import Swal from '../../../swal';

declare var bootstrap: any;

import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-student-add',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, NgxMaskDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-add.component.html',
  styleUrls: ['./student-add.component.css']
})
export class StudentAddComponent implements OnInit, AfterViewInit {

  title = 'Add Student';
  formSubmitted = false;

  // Needed for template binding
  GenderList = GenderList;

  // -------------------------------------------------------
  // CLEAN & CORRECT Student Model Initialization
  // -------------------------------------------------------
  newStudent: Student = {
    studentId: 0,
    admissionNo: null,
    enrollmentNo: null,
    uniqueStudentAttendanceNumber: 0,

    studentName: '',
    studentDOB: new Date(), // ✅ default Date object
    studentGender: GenderList.Male,

    studentReligion: '',
    studentBloodGroup: '',
    studentNationality: '',
    studentNIDNumber: '',
    studentContactNumber1: '',
    studentContactNumber2: '',

    studentEmail: '',
    studentPassword: '',
    parentEmail: '',
    parentPassword: '',
    permanentAddress: '',
    temporaryAddress: '',

    fatherName: '',
    fatherNID: '',
    fatherContactNumber: '',

    motherName: '',
    motherNID: '',
    motherContactNumber: '',

    localGuardianName: '',
    localGuardianContactNumber: '',

    imagePath: '',
    imageUpload: new ImageUpload(), // ✅ now Base64 string type

    standardId: null,
    standard: undefined,
    guardianPhone: '',
    admissionDate: new Date(),
    previousSchool: '',
    status: '',
    section: ''
  };

  // String properties for date input binding
  studentDOBStr: string = '';
  admissionDateStr: string = '';

  classes: Standard[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];

  // Premium Modal Visibility State
  showConfirmModal = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.loadClasses();
    this.loadSections();

    // Check if a classId was passed via query params (e.g., from class-list quick action)
    this.route.queryParams.subscribe(params => {
      if (params['classId']) {
        this.newStudent.standardId = Number(params['classId']);
      }
    });

    // Initialize date strings for input binding (YYYY-MM-DD)
    this.studentDOBStr = (this.newStudent.studentDOB as any).toISOString().split('T')[0];
    this.admissionDateStr = (this.newStudent.admissionDate as any).toISOString().split('T')[0];

    // Auto-generate Enrollment Number for display (must be numeric as per model)
    const year = new Date().getFullYear().toString().slice(-2);
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    this.newStudent.enrollmentNo = parseInt(year + randomStr, 10);

    // Explicitly clear email/password to prevent some browser autofills on load
    this.newStudent.studentEmail = '';
    this.newStudent.studentPassword = '';
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.classes = res;
        // If standardId was already set (via query params), trigger filter
        if (this.newStudent.standardId) {
          this.onClassChange();
        }
      },
      error: (err) => console.error('Failed to load classes', err)
    });
  }

  loadSections() {
    this.sectionService.getSections().subscribe({
      next: (res) => {
        this.sections = res;
        // If standardId was already set (via query params), trigger filter
        if (this.newStudent.standardId) {
          this.onClassChange();
        }
      },
      error: (err) => console.error('Failed to load sections', err)
    });
  }

  onClassChange() {
    if (this.newStudent.standardId) {
      const selectedClassName = this.getClassName(this.newStudent.standardId);
      this.filteredSections = this.sections.filter(s => s.className === selectedClassName);
    } else {
      this.filteredSections = [];
    }
    // Reset section if current one isn't in filtered list
    if (this.newStudent.section && !this.filteredSections.some(s => s.sectionName === this.newStudent.section)) {
      this.newStudent.section = '';
    }
  }

  getClassName(id: number | null | undefined): string {
    if (!id) return '';
    const cls = this.classes.find(c => c.standardId === id);
    return cls ? cls.standardName : '';
  }

  // -------------------------------------------------------
  // IMAGE UPLOAD (Base64)
  // -------------------------------------------------------
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.newStudent.imageUpload.file = file;
      this.newStudent.imageUpload.getBase64 = reader.result as string; // ✅ store string
    };
    reader.readAsDataURL(file);
  }

  // ── Premium Feedback ──
  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string, autoClose = false) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
    if (autoClose) {
      setTimeout(() => {
        this.showFeedbackModal = false;
        if (type === 'success') {
          this.router.navigate(['/student-list']);
        }
      }, 2200);
    }
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }

  // -------------------------------------------------------
  // EMAIL CHECKING LOGIC
  // -------------------------------------------------------
  onEmailBlur(email: string | undefined): void {
    if (!email) return;

    this.studentService.CheckEmail(email).subscribe({
      next: (res) => {
        if (res.exists) {
          this.showFeedback('warning', 'Email Already Exists!', `The email address "${email}" is already registered. Please use a different one.`);
          // Optionally clear the field:
          if (this.newStudent.studentEmail === email) this.newStudent.studentEmail = '';
          if (this.newStudent.parentEmail === email) this.newStudent.parentEmail = '';
        }
      },
      error: (err) => console.error('Error checking email', err)
    });
  }

  // -------------------------------------------------------
  // SUBMIT FORM
  // -------------------------------------------------------
  onSubmit(form: NgForm): void {
    this.formSubmitted = true;
    form.form.markAllAsTouched();

    if (form.invalid) {
      this.showFeedback('warning', 'Incomplete Form', 'Please fill in all required fields correctly.');
      return;
    }

    if (!this.studentDOBStr || !this.admissionDateStr) {
      this.showFeedback('warning', 'Dates Required', 'Please provide both Date of Birth and Admission Date.');
      return;
    }

    // Auto-generate hidden email and hardcode password based on requirements
    const enrollmentStr = this.newStudent.enrollmentNo?.toString() || 'student';
    this.newStudent.studentEmail = `${enrollmentStr}@visioncollegegojra.com`;
    this.newStudent.studentPassword = 'Noshahi.000';

    this.isProcessing = true;

    if (this.newStudent.studentEmail) {
      this.studentService.CheckEmail(this.newStudent.studentEmail).subscribe({
        next: (res) => {
          if (res.exists) {
            this.isProcessing = false;
            this.showFeedback('warning', 'Email Already Exists!', `The email address "${this.newStudent.studentEmail}" is already registered.`);
            this.newStudent.studentEmail = '';
            this.newStudent.studentPassword = '';
          } else {
            this.saveStudentData();
          }
        },
        error: (err) => {
          console.error('Error checking email', err);
          this.isProcessing = false;
          this.showFeedback('error', 'Validation Error', 'Unable to validate email at this time.');
        }
      });
    } else {
      this.saveStudentData();
    }
  }

  private saveStudentData(): void {
    // Prepare payload exactly for backend
    const studentToSave: any = {
      studentId: this.newStudent.studentId,
      admissionNo: this.newStudent.admissionNo,
      enrollmentNo: this.newStudent.enrollmentNo,
      uniqueStudentAttendanceNumber: 0,
      studentName: this.newStudent.studentName,
      studentDOB: this.studentDOBStr,
      studentGender: this.newStudent.studentGender,
      studentReligion: this.newStudent.studentReligion || null,
      studentBloodGroup: this.newStudent.studentBloodGroup || null,
      studentNationality: this.newStudent.studentNationality || null,
      studentNIDNumber: this.newStudent.studentNIDNumber || null,
      studentContactNumber1: this.newStudent.studentContactNumber1 || null,
      studentContactNumber2: this.newStudent.studentContactNumber2 || null,
      studentEmail: this.newStudent.studentEmail || null,
      studentPassword: this.newStudent.studentPassword || null,
      parentEmail: this.newStudent.parentEmail || null,
      parentPassword: this.newStudent.parentPassword || null,
      permanentAddress: this.newStudent.permanentAddress || null,
      temporaryAddress: this.newStudent.temporaryAddress || null,
      fatherName: this.newStudent.fatherName || null,
      fatherNID: this.newStudent.fatherNID || null,
      fatherContactNumber: this.newStudent.fatherContactNumber || null,
      motherName: this.newStudent.motherName || null,
      motherNID: this.newStudent.motherNID || null,
      motherContactNumber: this.newStudent.motherContactNumber || null,
      localGuardianName: this.newStudent.localGuardianName || null,
      localGuardianContactNumber: this.newStudent.localGuardianContactNumber || null,
      guardianPhone: this.newStudent.guardianPhone || null,
      admissionDate: this.admissionDateStr,
      previousSchool: this.newStudent.previousSchool || null,
      status: this.newStudent.status || null,
      section: this.newStudent.section || null,
      standardId: this.newStudent.standardId || null,
      academicYearId: this.sessionService.getCurrentYearId(),
      imagePath: this.newStudent.imageUpload.getBase64 || null
    };

    this.studentService.SaveStudent(studentToSave).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: () => {
        this.showFeedback('success', 'Enrolled Successfully', 'Student has been registered in the system. Redirecting...', true);
      },
      error: err => {
        console.error('Error while saving student', err);
        const errorMsg = err.error && typeof err.error === 'string'
          ? err.error
          : (err.error?.message ? err.error.message : 'Failed to save student. Please check all fields.');
        this.showFeedback('error', 'Enrollment Failed', errorMsg);
      }
    });
  }



  cancel(): void {
    this.router.navigate(['/student-list']);
  }

  ngAfterViewInit(): void { }
}


