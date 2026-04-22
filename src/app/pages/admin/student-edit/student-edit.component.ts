import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../../services/student.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../services/session.service';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PopupService } from '../../../services/popup.service';

declare var $: any;

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-edit.component.html',
  styleUrl: './student-edit.component.css'
})
export class StudentEditComponent implements OnInit, AfterViewInit {
  studentId: number = 0;
  studentData: Student = new Student();
  classes: Standard[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];
  loading: boolean = false;
  isSaving: boolean = false;

  // Form handling strings
  studentDOBStr: string = '';
  admissionDateStr: string = '';



  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private sessionService: SessionService,
    private popup: PopupService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.studentId = +params['id'];
      if (this.studentId) {
        this.loadStudentData();
        this.loadFilterData();
      }
    });
  }

  loadFilterData() {
    this.standardService.getStandards().subscribe(res => {
      this.classes = res;
      this.onClassChange();
    });
    this.sectionService.getSections().subscribe(res => {
      this.sections = res;
      this.onClassChange();
      // Re-normalize section if student data is already loaded
      if (this.studentData && this.studentData.section) {
        this.studentData.section = this.findMatchingSection(this.studentData.section);
      }
    });
  }

  loadStudentData() {
    this.loading = true;
    this.studentService.GetStudent(this.studentId).subscribe({
      next: (res) => {
        const normalized = this.mapStudentToUi(res);
        this.studentData = normalized;
        this.onClassChange(); // Filter sections for current class

        // Populate date strings for HTML input binding
        if (normalized.studentDOB) {
          const dobDate = new Date(normalized.studentDOB);
          if (!isNaN(dobDate.getTime())) {
            this.studentDOBStr = dobDate.toISOString().split('T')[0];
          }
        }

        if (normalized.admissionDate) {
          const admDate = new Date(normalized.admissionDate);
          if (!isNaN(admDate.getTime())) {
            this.admissionDateStr = admDate.toISOString().split('T')[0];
          }
        } else {
          // Fallback to today if null (for new records or missing data)
          this.admissionDateStr = new Date().toISOString().split('T')[0];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading student:", err);
        this.popup.error('Could not load student data. Please try again.', 'Load Failed');
        this.loading = false;
      }
    });
  }

  private mapStudentToUi(data: any): Student {
    if (!data) return {} as Student;

    // Normalizing Case Sensitivity (Backend PascalCase -> Frontend camelCase)
    const rawStatus = data.status ?? data.Status;
    let normalizedStatus = '';
    if (rawStatus) {
      const lower = rawStatus.toLowerCase();
      if (lower === 'active') normalizedStatus = 'Active';
      else if (lower === 'inactive') normalizedStatus = 'Inactive';
      else normalizedStatus = rawStatus;
    }

    return {
      studentId: data.studentId ?? data.StudentId,
      admissionNo: data.admissionNo ?? data.AdmissionNo,
      enrollmentNo: data.enrollmentNo ?? data.EnrollmentNo,
      uniqueStudentAttendanceNumber: data.uniqueStudentAttendanceNumber ?? data.UniqueStudentAttendanceNumber,
      studentName: data.studentName ?? data.StudentName,
      studentDOB: data.studentDOB ?? data.StudentDOB,
      studentGender: data.studentGender ?? data.StudentGender,
      studentReligion: data.studentReligion ?? data.StudentReligion,
      studentBloodGroup: data.studentBloodGroup ?? data.StudentBloodGroup,
      studentNationality: data.studentNationality ?? data.StudentNationality,
      studentNIDNumber: data.studentNIDNumber ?? data.StudentNIDNumber,
      studentContactNumber1: data.studentContactNumber1 ?? data.StudentContactNumber1,
      studentContactNumber2: data.studentContactNumber2 ?? data.StudentContactNumber2,
      studentEmail: data.studentEmail ?? data.StudentEmail,
      studentPassword: data.studentPassword ?? data.StudentPassword,
      parentEmail: data.parentEmail ?? data.ParentEmail,
      parentPassword: data.parentPassword ?? data.ParentPassword,
      permanentAddress: data.permanentAddress ?? data.PermanentAddress,
      temporaryAddress: data.temporaryAddress ?? data.TemporaryAddress,
      fatherName: data.fatherName ?? data.FatherName,
      fatherNID: data.fatherNID ?? data.FatherNID,
      fatherContactNumber: data.fatherContactNumber ?? data.FatherContactNumber,
      motherName: data.motherName ?? data.MotherName,
      motherNID: data.motherNID ?? data.MotherNID,
      motherContactNumber: data.motherContactNumber ?? data.MotherContactNumber,
      localGuardianName: data.localGuardianName ?? data.LocalGuardianName,
      localGuardianContactNumber: data.localGuardianContactNumber ?? data.LocalGuardianContactNumber,
      guardianPhone: data.guardianPhone ?? data.GuardianPhone,
      admissionDate: data.admissionDate ?? data.AdmissionDate,
      previousSchool: data.previousSchool ?? data.PreviousSchool,
      status: normalizedStatus,
      section: this.findMatchingSection(data.section ?? data.Section),
      standardId: data.standardId ?? data.StandardId,
      defaultDiscount: data.defaultDiscount ?? data.DefaultDiscount ?? 0,
      imagePath: data.imagePath ?? data.ImagePath,
      imageUpload: data.imageUpload ?? data.ImageUpload
    } as Student;
  }

  private findMatchingSection(val: string): string {
    if (!val) return '';
    if (this.sections && this.sections.length > 0) {
      const match = this.sections.find(s =>
        s.sectionName === val ||
        s.sectionCode === val ||
        s.sectionName === `Section ${val}`
      );
      if (match) return match.sectionName;
    }
    return val;
  }

  getStudentImage(): string {
    // 1. Check if we have a base64 image (newly selected upload)
    if (this.studentData.imageUpload && (this.studentData.imageUpload as any).imageData) {
      return (this.studentData.imageUpload as any).imageData;
    }

    // 2. Check if we have a saved path from the server
    if (this.studentData.imagePath) {
      // If it's already a full URL or base64, return as is
      if (this.studentData.imagePath.startsWith('http') || this.studentData.imagePath.startsWith('data:') || this.studentData.imagePath.startsWith('assets/')) {
        return this.studentData.imagePath;
      }
      // Otherwise prepend API base URL
      const normalizedPath = this.studentData.imagePath.replace(/\\/g, '/').replace(/^\//, '');
      
      // ⭐ Fix for live server where /images/ is intercepted by frontend
      const base = environment.apiBaseUrl || '/api';
      return `${base}/${normalizedPath}`;
    }

    // 3. Fallback to default
    return 'assets/images/user-grid/user-grid-img2.png';
  }

  onClassChange() {
    if (this.studentData.standardId) {
      const selectedClassName = this.getClassName(this.studentData.standardId);
      this.filteredSections = this.sections.filter(s => s.className === selectedClassName);
    } else {
      this.filteredSections = [];
    }
  }

  getClassName(id: number | null | undefined): string {
    if (!id) return '';
    const cls = this.classes.find(c => c.standardId === id);
    return cls ? cls.standardName : '';
  }

  // ── Premium Feedback ──

  saveStudent() {
    if (this.studentData) {
      // Basic validation for dates to avoid JSON conversion errors (500)
      if (!this.studentDOBStr || !this.admissionDateStr) {
        this.popup.warning('Please provide both Date of Birth and Admission Date.', 'Dates Required');
        return;
      }
      this.popup.confirm(
        'Save Changes?',
        'Are you sure you want to update this student record?',
        'Yes, Save',
        'Cancel',
        'success'
      ).then((confirmed) => {
        if (confirmed) {
          this.confirmUpdate();
        }
      });
    }
  }

  confirmUpdate(): void {
    if (this.studentData) {
      this.isSaving = true;
      this.popup.loading('Saving Details...');

      // Construct a clean payload
      const updatePayload: any = {
        studentId: Number(this.studentData.studentId),
        admissionNo: this.studentData.admissionNo,
        enrollmentNo: this.studentData.enrollmentNo,
        uniqueStudentAttendanceNumber: Number(this.studentData.uniqueStudentAttendanceNumber || 0),
        studentName: this.studentData.studentName,
        studentDOB: new Date(this.studentDOBStr).toISOString(), // Use full ISO string
        studentGender: this.studentData.studentGender,
        studentReligion: this.studentData.studentReligion || null,
        studentBloodGroup: this.studentData.studentBloodGroup || null,
        studentNationality: this.studentData.studentNationality || null,
        studentNIDNumber: this.studentData.studentNIDNumber || null,
        studentContactNumber1: this.studentData.studentContactNumber1 || null,
        studentContactNumber2: this.studentData.studentContactNumber2 || null,
        studentEmail: this.studentData.studentEmail || null,
        studentPassword: this.studentData.studentPassword || null,
        parentEmail: this.studentData.parentEmail || null,
        parentPassword: this.studentData.parentPassword || null,
        permanentAddress: this.studentData.permanentAddress || null,
        temporaryAddress: this.studentData.temporaryAddress || null,
        fatherName: this.studentData.fatherName || null,
        fatherNID: this.studentData.fatherNID || null,
        fatherContactNumber: this.studentData.fatherContactNumber || null,
        motherName: this.studentData.motherName || null,
        motherNID: this.studentData.motherNID || null,
        motherContactNumber: this.studentData.motherContactNumber || null,
        localGuardianName: this.studentData.localGuardianName || null,
        localGuardianContactNumber: this.studentData.localGuardianContactNumber || null,
        guardianPhone: this.studentData.guardianPhone || null,
        admissionDate: this.admissionDateStr ? new Date(this.admissionDateStr).toISOString() : null, // Use full ISO string
        previousSchool: this.studentData.previousSchool || null,
        status: this.studentData.status || null,
        section: this.studentData.section || null,
        standardId: this.studentData.standardId || null,
        defaultDiscount: this.studentData.defaultDiscount || 0,
        academicYearId: this.studentData.academicYearId || this.sessionService.getCurrentYearId(),
        imagePath: this.studentData.imagePath || null,
        imageUpload: null
      };

      if (this.studentData.imageUpload && (this.studentData.imageUpload as any).imageData) {
        updatePayload.imageUpload = {
          imageData: (this.studentData.imageUpload as any).imageData,
          imageName: (this.studentData.imageUpload as any).imageName || 'student_photo.png'
        };
      }

      this.studentService.UpdateStudent(updatePayload).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: () => {
          this.popup.closeLoading();
          this.popup.success('Student records have been successfully updated. Redirecting...', 'Profile Updated');
          setTimeout(() => {
            this.router.navigate(['/student-list']);
          }, 1500);
        },
        error: (err) => {
          console.error("Update error detailed:", err);
          this.popup.closeLoading();
          let errorMessage = 'Failed to update student information. Please check all fields.';
          if (err.error && typeof err.error === 'object') {
            if (err.error.errors) {
              errorMessage = Object.values(err.error.errors).flat().join(' ');
            } else if (err.error.message) {
              errorMessage = err.error.message;
            }
          }
          this.popup.error(errorMessage, 'Update Failed');
        }
      });
    }
  }

  cancel() {
    // Navigate back to staff list without saving
    this.router.navigate(['/student-list']);
  }

  ngAfterViewInit() {
    this.initializePasswordToggle('.toggle-password');
  }

  initializePasswordToggle(toggleSelector: string) {
    $(toggleSelector).on('click', function (this: any) {
      $(this).toggleClass("ri-eye-off-line");
      var input = $($(this).attr("data-toggle"));
      if (input.attr("type") === "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });
  }

  onImageSelected(event: any) {
    const input = event.target;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Content = e.target.result;

        if (!this.studentData.imageUpload) {
          this.studentData.imageUpload = {
            imageData: '',
            imageName: ''
          } as any;
        }

        this.studentData.imageUpload.imageData = base64Content;
        this.studentData.imageUpload.imageName = file.name;
        this.studentData.imagePath = base64Content; // Update Angular model for preview
      }
      reader.readAsDataURL(file);
    }
  }
  notificationSettings = {
    email: true,
    sms: false,
    push: true
  };

  saveNotificationSettings() {
    // Example: Save to localStorage or API
    localStorage.setItem('studentNotificationSettings', JSON.stringify(this.notificationSettings));
    this.popup.success('Notification preferences updated.', 'Settings Saved');
  }

}


