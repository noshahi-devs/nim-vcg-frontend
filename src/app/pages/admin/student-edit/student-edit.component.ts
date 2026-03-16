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
import Swal from '../../../swal';

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
  loading: boolean = false;

  // Form handling strings
  studentDOBStr: string = '';
  admissionDateStr: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private sessionService: SessionService
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
    this.standardService.getStandards().subscribe(res => this.classes = res);
    this.sectionService.getSections().subscribe(res => this.sections = res);
  }

  loadStudentData() {
    this.loading = true;
    this.studentService.GetStudent(this.studentId).subscribe({
      next: (res) => {
        this.studentData = res;
        
        // Populate date strings for HTML input binding
        if (this.studentData.studentDOB) {
          const dobDate = new Date(this.studentData.studentDOB);
          if (!isNaN(dobDate.getTime())) {
            this.studentDOBStr = dobDate.toISOString().split('T')[0];
          }
        }
        
        if (this.studentData.admissionDate) {
          const admDate = new Date(this.studentData.admissionDate);
          if (!isNaN(admDate.getTime())) {
            this.admissionDateStr = admDate.toISOString().split('T')[0];
          }
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading student:", err);
        Swal.fire('Error', 'Could not load student data', 'error');
        this.loading = false;
      }
    });
  }

  saveStudent() {
    if (this.studentData) {
      this.loading = true;

      Swal.fire({
        title: 'Updating Student...',
        text: 'Please wait while we process the request.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Map date strings back to the model
      this.studentData.studentDOB = this.studentDOBStr;
      this.studentData.admissionDate = this.admissionDateStr;

      // Construct a clean, flat payload object for the API
      // This avoids sending complex navigation objects (Standard/Section) which can cause 400 errors
      const updatePayload: any = {
        studentId: this.studentData.studentId,
        admissionNo: this.studentData.admissionNo,
        enrollmentNo: this.studentData.enrollmentNo,
        uniqueStudentAttendanceNumber: this.studentData.uniqueStudentAttendanceNumber || 0,
        studentName: this.studentData.studentName,
        studentDOB: this.studentDOBStr,
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
        admissionDate: this.admissionDateStr,
        previousSchool: this.studentData.previousSchool || null,
        status: this.studentData.status || null,
        section: this.studentData.section || null,
        standardId: this.studentData.standardId || null,
        academicYearId: this.studentData.academicYearId || this.sessionService.getCurrentYearId(),
        imagePath: this.studentData.imagePath || null,
        imageUpload: null // Handled separately if needed, or null if no new file
      };

      // Handle image payload alignment (ensure imageUpload is formatted if new image selected)
      if (this.studentData.imageUpload && (this.studentData.imageUpload as any).imageData) {
        updatePayload.imageUpload = {
          imageData: (this.studentData.imageUpload as any).imageData,
          imageName: (this.studentData.imageUpload as any).imageName || 'student_photo.png'
        };
      }

      console.log('🚀 Sending robust payload to API:', updatePayload);

      this.studentService.UpdateStudent(updatePayload).subscribe({
        next: () => {
          Swal.close();
          this.loading = false;
          Swal.fire({
            title: 'Updated!',
            text: 'Student information updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/student-list']);
          });
        },
        error: (err) => {
          Swal.close();
          this.loading = false;
          console.error("Update error detailed:", err);
          
          let errorMessage = 'Failed to update student information';
          if (err.error && typeof err.error === 'object') {
            if (err.error.errors) {
              errorMessage = Object.values(err.error.errors).flat().join('<br>');
            } else if (err.error.message) {
              errorMessage = err.error.message;
            }
          }
          
          Swal.fire({
            title: 'Update Failed',
            html: errorMessage,
            icon: 'error'
          });
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

    Swal.fire({
      title: 'Saved!',
      text: 'Notification settings saved successfully.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

}


