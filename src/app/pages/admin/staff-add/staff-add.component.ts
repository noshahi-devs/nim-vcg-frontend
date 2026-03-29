import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
import Swal from '../../../swal';
import { Designation, Gender, Staff } from '../../../Models/staff';
import { ImageUpload } from '../../../Models/StaticImageModel/imageUpload';
import { AuthService } from '../../../SecurityModels/auth.service';
import { PopupService } from '../../../services/popup.service';

declare var bootstrap: any;

@Component({
  selector: 'app-staff-add',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-add.component.html',
  styleUrl: './staff-add.component.css'
})
export class StaffAddComponent implements OnInit, AfterViewInit {
  formatPhone(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);
    if (val.length > 4) val = val.substring(0, 4) + '-' + val.substring(4);
    this.newStaff.contactNumber1 = val;
    event.target.value = val;
  }

  formatCnic(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.substring(0, 13);

    if (val.length > 12) {
      val = val.substring(0, 5) + '-' + val.substring(5, 12) + '-' + val.substring(12);
    } else if (val.length > 5) {
      val = val.substring(0, 5) + '-' + val.substring(5);
    }
    this.newStaff.cnic = val;
    event.target.value = val;
  }

  title = 'Add Staff';
  formSubmitted = false;
  selectedFile!: File;

  // String properties for date input binding
  dobStr: string = '';
  joiningDateStr: string = '';

  newStaff = {
    id: 0,
    staffName: '',
    contactNumber1: '',
    profile: 'assets/images/user-grid/user-grid-img2.png',
    joiningDate: '',
    designation: '',
    cnic: '',
    experience: '',
    customExperience: '',
    programDuration: '',
    gender: '',
    subject: '',
    customSubject: '',
    dob: '',
    email: '',
    password: '',
    qualifications: '',
    status: '',
    permanentAddress: '',
    section: '',
    uniqueStaffAttendanceNumber: 0,
    bg: 'assets/images/user-grid/user-grid-bg1.png',
    imageUpload: new ImageUpload()
  };

  constructor(
    private staffService: StaffService, 
    private router: Router, 
    private authService: AuthService,
    private popup: PopupService
  ) {
    this.setDefaultValues();
  }

  ngOnInit(): void {
    // Initialize date strings (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    this.dobStr = today;
    this.joiningDateStr = today;
  }

  setDefaultValues(): void {
    this.newStaff.experience = '1+';
    this.newStaff.gender = 'Male';
    this.newStaff.status = 'Active';
    this.newStaff.designation = 'Teacher';
    this.newStaff.qualifications = 'bachelors';
    this.newStaff.subject = 'bsEnglish';
  }

  // Convert file to Base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.newStaff.profile = URL.createObjectURL(file); // preview

      const base64 = await this.fileToBase64(file);

      // Correct: assign to ImageUpload instance
      const imgUpload = new ImageUpload();
      imgUpload.fileName = file.name;
      imgUpload.fileBase64 = base64;

      this.newStaff.imageUpload = imgUpload;
    }
  }

  // ── Premium Feedback & Processing ──
  isProcessing = false;

  async onSubmit(form: NgForm) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      this.popup.warning('Please fill in all required fields marked with *', 'Form Incomplete');
      return;
    }

    // Email check before proceeding
    if (this.newStaff.email) {
      this.isProcessing = true;
      this.popup.loading('Validating...');

      this.staffService.getStaffByEmail(this.newStaff.email).subscribe({
        next: (exists) => {
          this.isProcessing = false;
          this.popup.closeLoading();
          if (exists && exists.staffId) {
            this.popup.warning('This email is already in use.', 'Email Exists');
            return;
          }
          this.proceedWithStaffCreation();
        },
        error: () => {
          this.isProcessing = false;
          this.popup.closeLoading();
          this.proceedWithStaffCreation();
        }
      });
    } else {
      this.proceedWithStaffCreation();
    }
  }

  private proceedWithStaffCreation() {
    const designationMap: { [key: string]: Designation } = {
      'Teacher': Designation.Teacher,
      'Admin': Designation.Admin,
      'Principal': Designation.Principal,
      'Accountant': Designation.Accountant
    };

    const genderMap: { [key: string]: Gender } = {
      'Male': Gender.Male,
      'Female': Gender.Female,
      'Other': Gender.Other
    };

    const staffData: any = {
      staffId: 0,
      staffName: this.newStaff.staffName,
      uniqueStaffAttendanceNumber: this.newStaff.uniqueStaffAttendanceNumber,
      gender: genderMap[this.newStaff.gender] ?? Gender.Male,
      dob: this.dobStr || null,
      cnic: this.newStaff.cnic || null,
      experience: this.newStaff.experience || null,
      contactNumber1: this.newStaff.contactNumber1,
      email: this.newStaff.email || null,
      qualifications: this.newStaff.qualifications || null,
      joiningDate: this.joiningDateStr ? new Date(this.joiningDateStr) : null,
      designation: designationMap[this.newStaff.designation] ?? Designation.Teacher,
      permanentAddress: this.newStaff.permanentAddress || null,
      status: this.newStaff.status || "Active",
      imagePath: this.newStaff.profile || "assets/images/user-grid/user-grid-img2.png",
      imageUpload: this.newStaff.imageUpload?.fileBase64 ? {
        imageData: this.newStaff.imageUpload.fileBase64,
        imageName: this.newStaff.imageUpload.fileName || 'profile.png'
      } : null,
      staffExperiences: []
    };

    console.log('🚀 Sending staffData to API:', staffData);

    this.isProcessing = true;
    this.popup.loading('Creating staff profile...');

    const loginPayload = {
      email: this.newStaff.email,
      username: this.newStaff.email,
      password: this.newStaff.password,
      role: [this.newStaff.designation]
    };

    this.authService.register(loginPayload).subscribe({
      next: (authRes) => {
        this.createStaffProfile(staffData);
      },
      error: (authErr) => {
        // If user already exists (400) or registration fails, try to proceed if appropriate
        console.error('Auth Registration error:', authErr);

        // Use a more descriptive check for existing users
        const isDuplicateEmail = authErr.status === 400 &&
          (JSON.stringify(authErr.error).includes('DuplicateEmail') ||
            JSON.stringify(authErr.error).includes('already taken'));

        if (isDuplicateEmail) {
          console.warn('User already exists, attempting to link to this existing account');
          this.createStaffProfile(staffData);
        } else {
          this.isProcessing = false;
          this.popup.closeLoading();
          this.popup.error('Error', 'Could not create login credentials.');
        }
      }
    });
  }

  private createStaffProfile(staffData: any) {
    this.staffService.addStaff(staffData).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.success('Success', 'Staff added successfully.');
        setTimeout(() => {
          this.router.navigate(['/staff-list']);
        }, 1500);
      },
      error: (err) => {
        this.isProcessing = false;
        this.popup.closeLoading();
        console.error('❌ Profile creation error:', err);
        this.popup.error('Error', 'Could not save staff profile.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/staff-list']);
  }

  ngAfterViewInit(): void { }
}
