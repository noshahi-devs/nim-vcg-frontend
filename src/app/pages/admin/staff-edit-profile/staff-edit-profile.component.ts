import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../services/staff.service';
import { Staff, Designation, Gender } from '../../../Models/staff';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PopupService } from '../../../services/popup.service';
import { UserManagementService } from '../../../services/user-management.service';

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
  originalStaffData: any = null;
  loading: boolean = false;
  private readonly STORAGE_KEY = 'staffList';

  selectedImageBase64: string | null = null;
  selectedImageName: string | null = null;

  // Notification Switches
  securityAlerts = true;
  instituteUpdates = false;
  performanceReports = true;

  // Password Fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Visibility Flags
  showCurrPass = false;
  showNewPass = false;
  showConfPass = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private staffService: StaffService,
    private userService: UserManagementService,
    private popup: PopupService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.staffId = +params['id'];
      this.loadStaffData();
    });
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
        this.loading = false;
      }
    });
  }

  private mapStaffToUi(staff: any) {
    if (!staff) return null;
    return {
      id: staff.staffId,
      name: staff.staffName,
      cnic: staff.cnic || staff.CNIC || '',
      gender: this.getGenderName(staff.gender),
      dob: staff.dob ? staff.dob.split('T')[0] : '',
      phone: staff.contactNumber1 || '',
      email: staff.email || '',
      qualification: staff.qualifications || '',
      address: staff.permanentAddress || staff.temporaryAddress || '',
      profile: this.getStaffImage(staff.imagePath),
      status: staff.status || 'Active',
      role: this.getDesignationName(staff.designation),
      experience: staff.experience || staff.Experience || ''
    };
  }

  private getGenderName(gender: any): string {
    const Genders = ['Male', 'Female', 'Other'];
    return typeof gender === 'number' ? Genders[gender] : (gender || 'Male');
  }

  private getDesignationName(designation: any): string {
    return designation || 'Teacher';
  }

  getStaffImage(imagePath: string | undefined): string {
    const defaultImg = '/assets/images/user-grid/user-grid-img2.png';
    if (!imagePath) return defaultImg;
    
    // Clean potential double slashes and whitespaces
    let path = imagePath.toString().replace(/\/+/g, '/').trim();
    
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    // If it's already an absolute asset path
    if (path.startsWith('/assets/') || path.startsWith('assets/')) {
        return path.startsWith('/') ? path : '/' + path;
    }
    
    // Normalize relative paths
    let normalizedPath = path.replace(/\\/g, '/').replace(/^\//, '');
    
    // Ensure /images/ prefix is present for backend images
    if (!normalizedPath.startsWith('images/')) {
      normalizedPath = 'images/' + normalizedPath;
    }
    
    const base = environment.apiBaseUrl || '/api';
    return `${base}/${normalizedPath}`;
  }

  saveStaff() {
    if (this.staffData && this.originalStaffData) {
      this.loading = true;

      const updatedStaff = {
        ...this.originalStaffData,
        staffName: this.staffData.name,
        cnic: this.staffData.cnic,
        contactNumber1: this.staffData.phone,
        email: this.staffData.email,
        qualifications: this.staffData.qualification,
        permanentAddress: this.staffData.address,
        status: this.staffData.status,
        designation: this.getDesignationEnum(this.staffData.role),
        gender: this.getGenderEnum(this.staffData.gender),
        dob: this.staffData.dob,
        experience: this.staffData.experience,
        imageUpload: this.selectedImageBase64 ? {
          imageData: this.selectedImageBase64,
          imageName: this.selectedImageName || `${this.staffData.name}_profile.png`
        } : null
      };

      console.log('🚀 Sending updatedStaff to API:', updatedStaff);

      this.popup.loading('Updating Staff...');

      this.staffService.updateStaff(this.staffId, updatedStaff).subscribe({
        next: () => {
          this.loading = false;
          this.popup.closeLoading();
          this.popup.success('Success', 'Staff information updated successfully!');
          setTimeout(() => {
            this.router.navigate(['/staff-list']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error updating staff:', err);
          this.loading = false;
          this.popup.closeLoading();
          this.popup.error('Error', err.error?.message || 'Failed to update staff profile.');
        }
      });
    }
  }

  private getDesignationEnum(name: string): number {
    return (Designation as any)[name] || 0;
  }

  private getGenderEnum(name: string): number {
    return (Gender as any)[name] || 0;
  }

  cancel() {
    this.router.navigate(['/staff-list']);
  }

  updatePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.popup.warning('Warning', 'Please fill all password fields.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.popup.error('Error', 'New passwords do not match.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.popup.warning('Security Tip', 'Password must be at least 6 characters long.');
      return;
    }

    this.loading = true;
    this.popup.loading('Updating security credentials...');

    const payload = {
      Email: this.staffData.email,
      CurrentPassword: this.currentPassword,
      NewPassword: this.newPassword
    };

    this.userService.changePassword(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.popup.closeLoading();
        this.popup.success('Success', 'Password has been updated successfully!');
        
        // Clear fields
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loading = false;
        this.popup.closeLoading();
        console.error('Password Update Error:', err);
        const errorMsg = err.error?.message || err.error?.error || 'Update failed. Check your current password and password requirements.';
        this.popup.error('Update Failed', errorMsg);
      }
    });
  }

  forceReset() {
    if (!this.newPassword || !this.confirmPassword) {
      this.popup.warning('Warning', 'Please enter and confirm the new password.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.popup.error('Error', 'Passwords do not match.');
      return;
    }

    this.loading = true;
    this.popup.loading('Force resetting password (Admin)...');

    const payload = {
      Email: this.staffData.email,
      NewPassword: this.newPassword
    };

    this.userService.forceResetPassword(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.popup.closeLoading();
        this.popup.success('Success', 'Password has been force-reset successfully!');
        
        // Clear fields
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loading = false;
        this.popup.closeLoading();
        console.error('Force Reset Error:', err);
        this.popup.error('Reset Failed', err.error?.message || 'Access denied or server error.');
      }
    });
  }

  ngOnDestroy() { }

  ngAfterViewInit() {
    this.initializePasswordToggle('.toggle-password');
  }

  initializePasswordToggle(toggleSelector: string) {
    // Legacy JQuery removed in favor of Angular state
  }

  togglePasswordVisibility(field: 'curr' | 'new' | 'conf') {
    if (field === 'curr') this.showCurrPass = !this.showCurrPass;
    if (field === 'new') this.showNewPass = !this.showNewPass;
    if (field === 'conf') this.showConfPass = !this.showConfPass;
  }

  onImageSelected(event: any) {
    const input = event.target;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedImageName = file.name;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Content = e.target.result;
        this.selectedImageBase64 = base64Content;
        this.staffData.profile = base64Content; // Update Angular model for preview
      }
      reader.readAsDataURL(file);
    }
  }
}
