import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
import Swal from 'sweetalert2';
import { Designation, Gender, Staff } from '../../../Models/staff';
import { ImageUpload } from '../../../Models/StaticImageModel/imageUpload';
import { AuthService } from '../../../SecurityModels/auth.service';

declare var bootstrap: any;

@Component({
  selector: 'app-staff-add',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-add.component.html',
  styleUrl: './staff-add.component.css'
})
export class StaffAddComponent implements AfterViewInit {
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

  constructor(private staffService: StaffService, private router: Router, private authService: AuthService) {
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

  showPopup(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  async onSubmit(form: NgForm) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      Swal.fire({
        icon: 'error',
        title: 'Form Incomplete',
        text: 'Please fill in all required fields marked with *',
        confirmButtonText: 'OK'
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Save',
      text: 'Do you want to save this staff member?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel'
    }).then(async result => {
      if (result.isConfirmed) {
        const designationMap: { [key: string]: Designation } = {
          'Teacher': Designation.Instructor,
          'Staff': Designation.Other,
          'Admin': Designation.Other,
          'Accountant': Designation.Other
        };

        const genderMap: { [key: string]: Gender } = {
          'Male': Gender.Male,
          'Female': Gender.Female,
          'Other': Gender.Other
        };

        const staffData: Staff = {
          staffId: 0,
          staffName: this.newStaff.staffName,
          uniqueStaffAttendanceNumber: this.newStaff.uniqueStaffAttendanceNumber,
          gender: genderMap[this.newStaff.gender] ?? Gender.Male,
          dob: this.dobStr,
          contactNumber1: this.newStaff.contactNumber1,
          email: this.newStaff.email || null,
          qualifications: this.newStaff.qualifications || null,
          joiningDate: this.joiningDateStr ? new Date(this.joiningDateStr) : undefined,
          designation: designationMap[this.newStaff.designation] ?? Designation.Other,
          permanentAddress: this.newStaff.permanentAddress || null,
          status: this.newStaff.status || null,
          imagePath: this.newStaff.profile,
          imageUpload: this.newStaff.imageUpload, // Correct type
          staffExperiences: []
        };

        console.log('🚀 Sending staffData to API:', staffData);

        const loginPayload = {
          email: this.newStaff.email,
          username: this.newStaff.email,
          password: this.newStaff.password,
          role: [this.newStaff.designation]
        };

        this.authService.register(loginPayload).subscribe({
          next: (authRes) => {
            console.log('Login credentials created successfully', authRes);
            this.staffService.addStaff(staffData).subscribe({
              next: () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Staff Profile and Login Created Successfully!',
                  showConfirmButton: false,
                  timer: 1500
                });
                this.router.navigate(['/staff-list']);
              },
              error: (err) => {
                console.error('❌ Full error:', err);
                let errorMessage = 'Something went wrong while creating staff profile!';
                if (err.error) {
                  if (typeof err.error === 'string') errorMessage = err.error;
                  else if (err.error.message) errorMessage = err.error.message;
                  else if (err.error.errors) {
                    const errors = Object.values(err.error.errors).flat();
                    errorMessage = errors.join(', ');
                  } else errorMessage = JSON.stringify(err.error);
                }

                Swal.fire({
                  icon: 'error',
                  title: 'Failed to Add Staff Profile',
                  text: errorMessage,
                  footer: `Status: ${err.status}`
                });
              }
            });
          },
          error: (authErr) => {
            console.error('Auth Registration error:', authErr);
            let errMsg = 'Failed to create login credentials.';
            if (authErr.status === 400) {
              const backendErrors = authErr.error?.errors || authErr.error?.message;
              if (typeof backendErrors === 'object') {
                errMsg = Object.values(backendErrors).flat().join(', ');
              } else {
                errMsg = backendErrors || 'Invalid login details provided.';
              }
            } else if (authErr.status === 409) {
              errMsg = 'An account with this email/username already exists.';
            } else if (authErr.status === 500) {
              errMsg = 'Internal server error while creating login.';
            } else if (authErr.status === 0) {
              errMsg = 'Unable to connect to the authentication server.';
            } else {
              errMsg = authErr.error?.message || 'Something went wrong with authentication.';
            }

            Swal.fire({
              icon: 'error',
              title: 'Login Creation Failed',
              text: errMsg
            });
          }
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/staff-list']);
  }

  ngAfterViewInit(): void { }
}
