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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private staffService: StaffService,
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
    const defaultImg = 'assets/images/user-grid/user-grid-img2.png';
    if (!imagePath) return defaultImg;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:') || imagePath.startsWith('assets/')) return imagePath;
    const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\//, '');
    
    // ⭐ Fix for live server where /images/ is intercepted by frontend
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
    const currPass = (document.getElementById('curr-pass') as HTMLInputElement)?.value;
    const newPass = (document.getElementById('new-pass') as HTMLInputElement)?.value;
    const confPass = (document.getElementById('conf-pass') as HTMLInputElement)?.value;

    if (!currPass || !newPass || !confPass) return;

    if (newPass !== confPass) {
      this.popup.error('Error', 'Passwords do not match.');
      return;
    }

    this.loading = true;
    this.popup.loading('Updating security credentials...');
    setTimeout(() => {
      this.loading = false;
      this.popup.closeLoading();
      this.popup.success('Success', 'Security credentials updated!');
    }, 1500);
  }

  ngOnDestroy() { }

  ngAfterViewInit() {
    this.initializePasswordToggle('.toggle-password');
  }

  initializePasswordToggle(toggleSelector: string) {
    $(toggleSelector).on('click', function (this: any) {
      $(this).toggleClass("ri-eye-off-line");
      const input = $($(this).attr("data-toggle"));
      input.attr("type", input.attr("type") === "password" ? "text" : "password");
    });
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
