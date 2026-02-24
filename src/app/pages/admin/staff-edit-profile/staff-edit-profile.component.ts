import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../services/staff.service';
import { Staff, Designation, Gender } from '../../../Models/staff';
import { finalize } from 'rxjs';

declare var $: any;
declare var bootstrap: any;
@Component({
  selector: 'app-staff-edit-profile',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-edit-profile.component.html',
  styleUrl: './staff-edit-profile.component.css'
})
export class StaffEditProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'Edit Profile';
  staffId: number = 0;
  staffData: any = null;
  originalStaffData: any = null; // To store the full object from backend
  loading: boolean = false;
  private readonly STORAGE_KEY = 'staffList';

  // Modal state
  modalMessage: string = '';
  modalType: 'success' | 'error' = 'success';

  // Sample staff data - replace with actual service call
  staffList = this.loadStaffFromStorage() || [
    {
      id: 1,
      name: 'Ayesha Khan',
      cnic: '35202-1234567-8',
      gender: 'Female',
      dob: '1995-08-15',
      phone: '0312-1234567',
      email: 'ayesha.khan@noshahi.edu.pk',
      qualification: 'MBA',
      address: 'Lahore, Pakistan',
      joiningDate: '2021-02-12',
      profile: 'assets/images/user-grid/user-grid-img2.png',
      status: 'Active',
      bg: 'assets/images/user-grid/user-grid-bg2.png',
      role: 'Teacher',
      experience: '2 years'

    },
    {
      id: 2,
      name: 'Bilal Ahmad',
      cnic: '35201-7654321-9',
      gender: 'Male',
      dob: '1990-03-12',
      phone: '0321-9876543',
      email: 'bilal.ahmad@noshahi.edu.pk',
      qualification: 'B.Com',
      address: 'Faisalabad, Pakistan',
      joiningDate: '2019-06-01',
      profile: 'assets/images/user-grid/user-grid-img3.png',
      status: 'Active',
      bg: 'assets/images/user-grid/user-grid-bg3.png',
      role: 'Principal',
      experience: '2 years'

    },
    {
      id: 3,
      name: 'Hamza Tariq',
      cnic: '35203-2222333-4',
      gender: 'Male',
      dob: '1997-01-10',
      phone: '0301-2223344',
      email: 'hamza.tariq@noshahi.edu.pk',
      qualification: 'BS IT',
      address: 'Multan, Pakistan',
      joiningDate: '2020-09-10',
      profile: 'assets/images/user-grid/user-grid-img4.png',
      status: 'Active',
      bg: 'assets/images/user-grid/user-grid-bg4.png',
      role: 'Accountant',
      experience: '2 years'

    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private staffService: StaffService
  ) { }

  ngOnInit() {
    // Get staff ID from route
    this.route.params.subscribe(params => {
      this.staffId = +params['id']; // + converts string to number
      this.loadStaffData();
    });
  }

  // Load staff data from localStorage
  loadStaffFromStorage(): any[] | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Save staff data to localStorage
  saveStaffToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.staffList));
  }

  // Show modal by ID
  showModal(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // Hide modal by ID
  hideModal(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
  }

  loadStaffData() {
    this.loading = true;
    this.staffService.getStaffById(this.staffId).subscribe({
      next: (staff: any) => {
        this.originalStaffData = staff;
        this.staffData = this.mapStaffToUi(staff);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading staff for edit:', err);
        this.loadStaffFromBackup();
        this.loading = false;
      }
    });
  }

  private mapStaffToUi(staff: any) {
    if (!staff) return null;
    return {
      id: staff.staffId,
      name: staff.staffName,
      cnic: staff.cnic || '',
      gender: this.getGenderName(staff.gender),
      dob: staff.dob ? staff.dob.split('T')[0] : '', // Format for date input
      phone: staff.contactNumber1 || '',
      email: staff.email || '',
      qualification: staff.qualifications || '',
      address: staff.permanentAddress || staff.temporaryAddress || '',
      profile: staff.imagePath || 'assets/images/user-grid/user-grid-img2.png',
      status: staff.status || 'Active',
      role: this.getDesignationName(staff.designation)
    };
  }

  private getGenderName(gender: any): string {
    const Genders = ['Male', 'Female', 'Other'];
    return typeof gender === 'number' ? Genders[gender] : (gender || 'Male');
  }

  private getDesignationName(designation: any): string {
    if (typeof designation === 'number') {
      return Designation[designation] || 'Teacher';
    }
    return designation || 'Teacher';
  }

  saveStaff() {
    if (this.staffData && this.originalStaffData) {
      this.loading = true;

      // Merge UI changes back into original staff object
      const updatedStaff = {
        ...this.originalStaffData,
        staffName: this.staffData.name,
        contactNumber1: this.staffData.phone,
        email: this.staffData.email,
        qualifications: this.staffData.qualification,
        permanentAddress: this.staffData.address,
        status: this.staffData.status,
        designation: this.getDesignationEnum(this.staffData.role),
        gender: this.getGenderEnum(this.staffData.gender),
        dob: this.staffData.dob
      };

      this.staffService.updateStaff(this.staffId, updatedStaff).subscribe({
        next: () => {
          this.loading = false;
          this.modalMessage = 'Staff information updated successfully in database!';
          this.modalType = 'success';
          this.showModal('messageModal');
          setTimeout(() => {
            this.hideModal('messageModal'); // Explicitly hide modal
            this.router.navigate(['/staff-list']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error updating staff:', err);
          this.loading = false;
          this.modalMessage = 'Failed to update staff in database. Check console for details.';
          this.modalType = 'error';
          this.showModal('messageModal');
        }
      });
    }
  }

  private mapUiToStaff(uiData: any): any {
    // Map UI values back to backend model expected by StaffService
    return {
      staffId: this.staffId,
      staffName: uiData.name,
      contactNumber1: uiData.phone,
      email: uiData.email,
      qualifications: uiData.qualification,
      permanentAddress: uiData.address,
      status: uiData.status,
      // Map back enums if necessary, or send strings if backend supports them
      designation: this.getDesignationEnum(uiData.role),
      gender: this.getGenderEnum(uiData.gender),
      dob: uiData.dob
    };
  }

  private getDesignationEnum(name: string): number {
    return (Designation as any)[name] || 0;
  }

  private getGenderEnum(name: string): number {
    return (Gender as any)[name] || 0;
  }

  private loadStaffFromBackup() {
    let loadedList = this.loadStaffFromStorage();
    if (loadedList) {
      this.staffData = loadedList.find(staff => +staff.id === +this.staffId);
    }
  }

  cancel() {
    // Navigate back to staff list without saving
    this.router.navigate(['/staff-list']);
  }

  updatePassword() {
    const currPass = (document.getElementById('curr-pass') as HTMLInputElement)?.value;
    const newPass = (document.getElementById('new-pass') as HTMLInputElement)?.value;
    const confPass = (document.getElementById('conf-pass') as HTMLInputElement)?.value;

    if (!currPass || !newPass || !confPass) {
      this.modalMessage = 'Please fill in all password fields.';
      this.modalType = 'error';
      this.showModal('messageModal');
      return;
    }

    if (newPass !== confPass) {
      this.modalMessage = 'New passwords do not match.';
      this.modalType = 'error';
      this.showModal('messageModal');
      return;
    }

    if (newPass.length < 8) {
      this.modalMessage = 'New password must be at least 8 characters long.';
      this.modalType = 'error';
      this.showModal('messageModal');
      return;
    }

    this.loading = true;
    // Simulate API call for password update
    setTimeout(() => {
      this.loading = false;
      this.modalMessage = 'Security credentials updated successfully!';
      this.modalType = 'success';
      this.showModal('messageModal');

      // Clear fields
      (document.getElementById('curr-pass') as HTMLInputElement).value = '';
      (document.getElementById('new-pass') as HTMLInputElement).value = '';
      (document.getElementById('conf-pass') as HTMLInputElement).value = '';
    }, 1500);
  }

  ngOnDestroy() {
    // Force cleanup of any stray backdrops when component is destroyed
    this.hideModal('messageModal');
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open').css('overflow', '');
  }

  ngAfterViewInit() {

    $("#imageUpload").change(function () {
      this.readURL(this);
    });

    // ================== Password Show Hide Js Start ==========
    // Call the function
    this.initializePasswordToggle('.toggle-password');
  }
  initializePasswordToggle(toggleSelector) {
    $(toggleSelector).on('click', function () {
      $(this).toggleClass("ri-eye-off-line");
      var input = $($(this).attr("data-toggle"));
      if (input.attr("type") === "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });
  }
  readURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#imagePreview').css('background-image', 'url(' + e.target.result + ')');
        $('#imagePreview').hide();
        $('#imagePreview').fadeIn(650);
      }
      reader.readAsDataURL(input.files[0]);
    }
  }
}
