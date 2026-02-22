import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
import Swal from 'sweetalert2';
import { Designation, Gender, Staff } from '../../../Models/staff';
import { ImageUpload } from '../../../Models/StaticImageModel/imageUpload';

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
  validateEmail() {
    throw new Error('Method not implemented.');
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
    qualifications: '',
    status: '',
    permanentAddress: '',
    section: '',
    uniqueStaffAttendanceNumber: 0,
    bg: 'assets/images/user-grid/user-grid-bg1.png',
    imageUpload: new ImageUpload()
  };

  constructor(private staffService: StaffService, private router: Router) {
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
          'Instructor': Designation.Instructor,
          'Teacher': Designation.Instructor,
          'Professor': Designation.Professor,
          'Principal': Designation.Headmaster,
          'Headmistress': Designation.Headmistress,
          'Counselor': Designation.Counselor,
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

        this.staffService.addStaff(staffData).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Staff Added Successfully!',
              showConfirmButton: false,
              timer: 1500
            });
            this.router.navigate(['/staff-list']);
          },
          error: (err) => {
            console.error('❌ Full error:', err);
            let errorMessage = 'Something went wrong!';
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
              title: 'Failed to Add Staff',
              text: errorMessage,
              footer: `Status: ${err.status}`
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
