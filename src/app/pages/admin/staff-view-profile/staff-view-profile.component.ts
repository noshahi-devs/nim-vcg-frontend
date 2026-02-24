import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { Designation } from '../../../Models/staff';
import { animate, style, transition, trigger } from '@angular/animations';

declare var $: any;

@Component({
  selector: 'app-staff-view-profile',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-view-profile.component.html',
  styleUrl: './staff-view-profile.component.css',
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class StaffViewProfileComponent implements OnInit, AfterViewInit {
  title = 'View Profile';
  staffId: number = 0;
  staffData: any = null;
  loading: boolean = false;
  activeTab: 'overview' | 'attendance' | 'performance' = 'overview';
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
      experience: '2 years',
      attendance: {
        percentage: 92,
        presentDays: 21,
        absentDays: 2,
        lateDays: 1,
        totalDays: 24,
        history: [
          { month: 'Jan', rate: 95 },
          { month: 'Feb', rate: 92 }
        ]
      },
      performance: {
        rating: 4.8,
        tasksCompleted: 45,
        totalTasks: 50,
        studentFeedback: 'Excellent teaching style and very punctual.',
        skills: ['Curriculum Planning', 'Classroom Management', 'Student Counseling']
      }
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
      experience: '2 years',
      attendance: {
        percentage: 98,
        presentDays: 23,
        absentDays: 1,
        lateDays: 0,
        totalDays: 24,
        history: [
          { month: 'Jan', rate: 97 },
          { month: 'Feb', rate: 98 }
        ]
      },
      performance: {
        rating: 4.9,
        tasksCompleted: 58,
        totalTasks: 60,
        studentFeedback: 'Great leadership and very supportive.',
        skills: ['Leadership', 'Strategic Planning', 'Administration']
      }
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
      experience: '2 years',
      attendance: {
        percentage: 95,
        presentDays: 22,
        absentDays: 1,
        lateDays: 1,
        totalDays: 24,
        history: [
          { month: 'Jan', rate: 94 },
          { month: 'Feb', rate: 95 }
        ]
      },
      performance: {
        rating: 4.7,
        tasksCompleted: 82,
        totalTasks: 85,
        studentFeedback: 'Very meticulous with accounts and reports.',
        skills: ['Financial Accounting', 'Auditing', 'Excel Expert']
      }
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private staffService: StaffService
  ) { }

  ngOnInit() {
    // Get staff ID from route
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.staffId = +idParam;
      } else {
        // Handle "My Profile" case: no ID provided
        const currentUser = this.authService.userValue;
        if (currentUser) {
          // Look up staff ID by email
          const currentStaff = this.staffList.find(s => s.email === currentUser.email);
          if (currentStaff) {
            this.staffId = +currentStaff.id;
          }
        }
      }
      this.loadStaffData();
    });
  }

  // Load staff data from localStorage
  loadStaffFromStorage(): any[] | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  loadStaffData() {
    this.loading = true;
    this.staffService.getStaffById(this.staffId).subscribe({
      next: (staff: any) => {
        this.staffData = this.mapStaffToUi(staff);
        this.loading = false;
        this.checkAuthorization();
      },
      error: (err) => {
        console.error('Error loading staff from service:', err);
        // Fallback to local storage or mock if service fails
        this.loadStaffFromBackup();
        this.loading = false;
      }
    });
  }

  private mapStaffToUi(staff: any) {
    if (!staff) return null;

    // Use default values for missing data to maintain UI quality
    return {
      id: staff.staffId,
      name: staff.staffName,
      cnic: staff.cnic || 'N/A', // Assuming CNIC might be missing in backend Staff model
      gender: this.getGenderName(staff.gender),
      dob: staff.dob ? new Date(staff.dob).toLocaleDateString() : 'N/A',
      phone: staff.contactNumber1 || 'N/A',
      email: staff.email || 'N/A',
      qualification: staff.qualifications || 'N/A',
      address: staff.permanentAddress || staff.temporaryAddress || 'N/A',
      joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : 'N/A',
      profile: staff.imagePath || 'assets/images/user-grid/user-grid-img2.png',
      status: staff.status || 'Active',
      role: this.getDesignationName(staff.designation),
      experience: staff.staffExperiences?.length > 0 ? `${staff.staffExperiences.length} entries` : 'No data',
      // Keep enhanced mock data for attendance/performance as per user requirement
      attendance: staff.attendance || {
        percentage: 92,
        presentDays: 21,
        absentDays: 2,
        lateDays: 1,
        totalDays: 24,
        history: [
          { month: 'Jan', rate: 95 },
          { month: 'Feb', rate: 92 }
        ]
      },
      performance: staff.performance || {
        rating: 4.8,
        tasksCompleted: 45,
        totalTasks: 50,
        studentFeedback: 'Excellent teaching style and very punctual.',
        skills: ['Curriculum Planning', 'Classroom Management', 'Student Counseling']
      }
    };
  }

  private getGenderName(gender: any): string {
    if (gender === null || gender === undefined) return 'N/A';
    const Genders = ['Male', 'Female', 'Other'];
    return Genders[gender] || gender;
  }

  private getDesignationName(designation: any): string {
    if (designation === null || designation === undefined) return 'N/A';
    if (typeof designation === 'number') {
      return Designation[designation] || 'N/A';
    }
    return designation;
  }

  private checkAuthorization() {
    const currentUser = this.authService.userValue;
    const isPrivileged = this.authService.hasAnyRole(['Admin', 'Principal']);

    if (this.staffData && !isPrivileged) {
      if (currentUser && this.staffData.email !== currentUser.email) {
        console.warn('Unauthorized access attempt to staff profile:', this.staffId);
        this.router.navigate(['/unauthorized']);
      }
    }
  }

  private loadStaffFromBackup() {
    let loadedList = this.loadStaffFromStorage();
    if (loadedList) {
      this.staffData = loadedList.find(staff => +staff.id === +this.staffId);
    }
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
    this.router.navigate(['/staff-edit-profile', id]);
  }
}
