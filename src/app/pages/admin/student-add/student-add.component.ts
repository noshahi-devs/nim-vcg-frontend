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
import Swal from '../../../swal';
import { SessionService } from '../../../services/session.service';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studentService: StudentService,
    private standardService: StandardService,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.loadClasses();

    // Check if a classId was passed via query params (e.g., from class-list quick action)
    this.route.queryParams.subscribe(params => {
      if (params['classId']) {
        this.newStudent.standardId = Number(params['classId']);
      }
    });

    // Initialize date strings for input binding (YYYY-MM-DD)
    this.studentDOBStr = (this.newStudent.studentDOB as any).toISOString().split('T')[0];
    this.admissionDateStr = (this.newStudent.admissionDate as any).toISOString().split('T')[0];

    // Explicitly clear email/password to prevent some browser autofills on load
    this.newStudent.studentEmail = '';
    this.newStudent.studentPassword = '';
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => this.classes = res,
      error: (err) => console.error('Failed to load classes', err)
    });
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

  // -------------------------------------------------------
  // MODAL SHOW HELPERS
  // -------------------------------------------------------
  showPopup(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  // -------------------------------------------------------
  // EMAIL CHECKING LOGIC
  // -------------------------------------------------------
  onEmailBlur(email: string | undefined): void {
    if (!email) return;

    this.studentService.CheckEmail(email).subscribe({
      next: (res) => {
        if (res.exists) {
          Swal.fire({
            title: 'Email Already Exists!',
            text: `The email address "${email}" is already registered. Please use a different one.`,
            icon: 'warning',
            confirmButtonText: 'OK',
            customClass: {
              popup: 'nim-swal-popup',
              title: 'nim-swal-title',
              htmlContainer: 'nim-swal-text',
              confirmButton: 'nim-swal-btn nim-swal-confirm'
            }
          });
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
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill in all required fields correctly.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    Swal.fire({
      title: 'Creating Student...',
      text: 'Please wait while we process the request.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    if (this.newStudent.studentEmail) {

      this.studentService.CheckEmail(this.newStudent.studentEmail).subscribe({
        next: (res) => {
          if (res.exists) {
            Swal.close();
            Swal.fire({
              title: 'Email Already Exists!',
              text: `The email address "${this.newStudent.studentEmail}" is already registered. Please use a different one.`,
              icon: 'warning',
              confirmButtonText: 'OK',
              customClass: {
                popup: 'nim-swal-popup',
                title: 'nim-swal-title',
                htmlContainer: 'nim-swal-text',
                confirmButton: 'nim-swal-btn nim-swal-confirm'
              }
            });
            this.newStudent.studentEmail = '';
            this.newStudent.studentPassword = '';
          } else {
            this.saveStudentData();
          }
        },
        error: (err) => {
          console.error('Error checking email', err);
          Swal.close();
          Swal.fire('Error', 'Unable to validate email at this time.', 'error');
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

    console.log('Payload to API:', studentToSave); // optional debug

    this.studentService.SaveStudent(studentToSave).subscribe({
      next: () => {
        Swal.close();
        Swal.fire({
          icon: 'success',
          title: 'Student Enrolled Successfully!',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          this.router.navigate(['/student-list']);
        });
      },
      error: err => {
        Swal.close();
        console.error('Error while saving student', err);
        const errorMsg = err.error && typeof err.error === 'string'
          ? err.error
          : 'Failed to save student. Please check all fields.';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }



  cancel(): void {
    this.router.navigate(['/student-list']);
  }

  ngAfterViewInit(): void { }
}


