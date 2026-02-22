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
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-student-add',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
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
    private standardService: StandardService
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
  // SUBMIT FORM
  // -------------------------------------------------------
  onSubmit(form: NgForm): void {
    this.formSubmitted = true;
    form.form.markAllAsTouched();

    if (form.invalid) {
      this.showPopup('validationModal');
      return;
    }

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
      imagePath: this.newStudent.imageUpload.getBase64 || null
    };



    // Set image data correctly for backend

    console.log('Payload to API:', studentToSave); // optional debug

    this.studentService.SaveStudent(studentToSave).subscribe({
      next: () => {
        this.showPopup('successModal');

        setTimeout(() => {
          const modalEl = document.getElementById('successModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();

          document.querySelectorAll('.modal-backdrop')
            .forEach(b => b.remove());

          this.router.navigate(['/student-list']);
        }, 1200);
      },
      error: err => {
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
