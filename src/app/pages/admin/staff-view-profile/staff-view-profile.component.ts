import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
declare var $: any;
@Component({
  selector: 'app-staff-view-profile',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-view-profile.component.html',
  styleUrl: './staff-view-profile.component.css'
})
export class StaffViewProfileComponent implements OnInit, AfterViewInit {
  title = 'View Profile';
  staffId: number = 0;
  staffData: any = null;
  private readonly STORAGE_KEY = 'staffList';

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
      status: 'active',
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

  loadStaffData() {
    // Reload from localStorage or default list
    let loadedList = this.loadStaffFromStorage();

    // If localStorage data exists but doesn't have role field, clear it and use default
    if (loadedList && loadedList.length > 0 && !loadedList[0].hasOwnProperty('role')) {
      localStorage.removeItem(this.STORAGE_KEY);
      loadedList = null;
    }

    this.staffList = loadedList || this.staffList;

    // Convert to number and find matching staff
    this.staffData = this.staffList.find(staff => +staff.id === +this.staffId);
  }


  goBack() {
    // Navigate back to staff list
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
  editStaff(id: number) {
    this.router.navigate(['/staff-edit', id]);
  }
}
