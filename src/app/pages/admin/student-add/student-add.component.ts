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
import { PopupService } from '../../../services/popup.service';
import { FeeService } from '../../../services/fee.service';
import { Fee } from '../../../Models/fee';

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
    section: '',
    defaultDiscount: 0
  };

  // String properties for date input binding
  studentDOBStr: string = '';
  admissionDateStr: string = '';

  classes: Standard[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];
  
  // Fee Management
  allFees: Fee[] = [];
  assignedFees: { fee: Fee; checked: boolean; amount: number }[] = [];

  // Premium Modal Visibility State
  isProcessing = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private sessionService: SessionService,
    private feeService: FeeService,
    private popup: PopupService
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
      this.loadFeesForClass(this.newStudent.standardId);
    } else {
      this.filteredSections = [];
      this.assignedFees = [];
    }
    // Reset section if current one isn't in filtered list
    if (this.newStudent.section && !this.filteredSections.some(s => s.sectionName === this.newStudent.section)) {
      this.newStudent.section = '';
    }
  }

  loadFeesForClass(classId: number) {
    this.feeService.getAllFees().subscribe({
      next: (res) => {
        this.allFees = res.filter(f => f.standardId === classId);
        this.assignedFees = this.allFees.map(f => ({
          fee: f,
          checked: false,
          amount: f.amount // Default amount fetched from assigned Fee
        }));
      },
      error: (err) => console.error('Failed to load fees', err)
    });
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
      this.newStudent.imagePath = reader.result as string; // For preview
    };
    reader.readAsDataURL(file);
  }

  getStudentImage(): string {
    const defaultImg = 'assets/images/user-grid/user-grid-img2.png';
    if (!this.newStudent.imagePath) return defaultImg;
    if (this.newStudent.imagePath.startsWith('http') || 
        this.newStudent.imagePath.startsWith('data:') || 
        this.newStudent.imagePath.startsWith('assets/')) {
      return this.newStudent.imagePath;
    }
    return this.newStudent.imagePath;
  }



  // -------------------------------------------------------
  // EMAIL CHECKING LOGIC
  // -------------------------------------------------------
  onEmailBlur(email: string | undefined): void {
    if (!email) return;

    this.studentService.CheckEmail(email).subscribe({
      next: (res) => {
        if (res.exists) {
          this.popup.warning(`The email address "${email}" is already registered. Please use a different one.`, 'Email Already Exists!');
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
      this.popup.warning('Please fill in all required fields correctly.', 'Incomplete Form');
      return;
    }

    if (!this.studentDOBStr || !this.admissionDateStr) {
      this.popup.warning('Please provide both Date of Birth and Admission Date.', 'Dates Required');
      return;
    }

    // Auto-generate hidden email and hardcode password based on requirements
    const enrollmentStr = this.newStudent.enrollmentNo?.toString() || 'student';
    this.newStudent.studentEmail = `${enrollmentStr}@visioncollegegojra.com`;
    this.newStudent.studentPassword = 'Noshahi.000';

    this.isProcessing = true;
    this.popup.loading('Validating details...');

    if (this.newStudent.studentEmail) {
      this.studentService.CheckEmail(this.newStudent.studentEmail).subscribe({
        next: (res) => {
          if (res.exists) {
            this.isProcessing = false;
            this.popup.closeLoading();
            this.popup.warning(`The email address "${this.newStudent.studentEmail}" is already registered.`, 'Email Already Exists!');
            this.newStudent.studentEmail = '';
            this.newStudent.studentPassword = '';
          } else {
            this.saveStudentData();
          }
        },
        error: (err) => {
          console.error('Error checking email', err);
          this.isProcessing = false;
          this.popup.closeLoading();
          this.popup.error('Unable to validate email at this time.', 'Validation Error');
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
      defaultDiscount: this.newStudent.defaultDiscount || 0,
      academicYearId: this.sessionService.getCurrentYearId(),
      studentFees: this.assignedFees.filter(af => af.checked).map(af => ({
        feeId: af.fee.feeId,
        assignedAmount: af.amount
      })),
      imageUpload: this.newStudent.imageUpload.getBase64 ? {
        imageData: this.newStudent.imageUpload.getBase64,
        imageName: this.newStudent.imageUpload.file?.name || 'student_photo.png'
      } : null
    };

    this.popup.loading('Registering Student...');

    this.studentService.SaveStudent(studentToSave).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: () => {
        this.popup.closeLoading();
        this.popup.success('Student has been registered in the system.', 'Enrolled Successfully');
        setTimeout(() => {
          this.router.navigate(['/student-list']);
        }, 1500);
      },
      error: err => {
        console.error('Error while saving student', err);
        this.popup.closeLoading();
        const errorMsg = err.error && typeof err.error === 'string'
          ? err.error
          : (err.error?.message ? err.error.message : 'Failed to save student. Please check all fields.');
        this.popup.error(errorMsg, 'Enrollment Failed');
      }
    });
  }



  cancel(): void {
    this.router.navigate(['/student-list']);
  }

  ngAfterViewInit(): void { }
}


