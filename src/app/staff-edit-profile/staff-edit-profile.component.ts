import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class StaffEditProfileComponent implements OnInit, AfterViewInit {
  title = 'Edit Profile';
  staffId: number = 0;
  staffData: any = null;
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

  constructor(private route: ActivatedRoute, private router: Router) { }

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

  loadStaffData() {
    // Reload from localStorage to get latest data
    this.staffList = this.loadStaffFromStorage() || this.staffList;
    // Find staff by ID
    this.staffData = this.staffList.find(staff => staff.id === this.staffId);
  }

  saveStaff() {
    if (this.staffData) {
      // Update the staff in the list
      const index = this.staffList.findIndex(s => s.id === this.staffId);
      if (index !== -1) {
        this.staffList[index] = { ...this.staffData };
      }
      
      // Save to localStorage
      this.saveStaffToStorage();
      
      // Show success modal
      this.modalMessage = 'Staff information updated successfully!';
      this.modalType = 'success';
      this.showModal('messageModal');
      
      // Navigate back to staff list after delay
      setTimeout(() => this.router.navigate(['/staff-list']), 1200);
    }
  }

  cancel() {
    // Navigate back to staff list without saving
    this.router.navigate(['/staff-list']);
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
