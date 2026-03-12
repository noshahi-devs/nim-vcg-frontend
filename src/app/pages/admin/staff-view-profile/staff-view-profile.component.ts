import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { Designation } from '../../../Models/staff';
import { animate, style, transition, trigger } from '@angular/animations';
import { AttendanceService } from '../../../services/attendance.service';

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
  defaultAvatar = 'assets/images/user-grid/user-grid-img2.png';

  attendanceStats = {
    percentage: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    totalDays: 0,
    history: [] as any[]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private staffService: StaffService,
    private attendanceService: AttendanceService
  ) { }

  get currentUserEmail(): string {
    return this.authService.userValue?.email || 'N/A';
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.staffId = +idParam;
        this.loadStaffData();
      } else {
        this.loadMyProfile();
      }
    });
  }

  loadMyProfile() {
    this.loading = true;
    const currentUser = this.authService.userValue;
    if (currentUser?.email) {
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const currentStaff = staffs.find(s =>
            s.email?.trim().toLowerCase() === currentUser.email?.trim().toLowerCase()
          );
          if (currentStaff) {
            this.staffId = currentStaff.staffId;
            this.loadStaffData();
          } else {
            this.loading = false;
          }
        },
        error: () => this.loading = false
      });
    } else {
      this.loading = false;
    }
  }

  loadStaffData() {
    this.loading = true;
    this.staffService.getStaffById(this.staffId).subscribe({
      next: (staff: any) => {
        this.staffData = this.mapStaffToUi(staff);
        this.loadAttendanceData();
        this.loading = false;
        this.checkAuthorization();
      },
      error: (err) => {
        console.error('Error loading staff:', err);
        this.loading = false;
      }
    });
  }

  loadAttendanceData() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = now.toISOString();

    this.attendanceService.getStaffAttendanceReport(this.staffId, startDate, endDate).subscribe({
      next: (report: any[]) => {
        if (!report || report.length === 0) return;

        const total = report.length;
        const present = report.filter(r => r.isPresent || r.IsPresent).length;
        const absent = report.filter(r => !(r.isPresent || r.IsPresent)).length;
        
        this.attendanceStats = {
          totalDays: total,
          presentDays: present,
          absentDays: absent,
          lateDays: 0, // Not explicitly tracked in simple boolean report
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
          history: [] // Could be populated if needed
        };

        if (this.staffData) {
          this.staffData.attendance = this.attendanceStats;
        }
      },
      error: (err) => console.error('Error loading attendance:', err)
    });
  }

  private mapStaffToUi(staff: any) {
    if (!staff) return null;

    return {
      id: staff.staffId,
      name: staff.staffName || 'N/A',
      cnic: staff.cnic || staff.CNIC || 'N/A',
      gender: this.getGenderName(staff.gender),
      dob: this.formatDate(staff.dob),
      phone: staff.contactNumber1 || 'N/A',
      email: staff.email || 'N/A',
      qualification: staff.qualifications || 'N/A',
      address: staff.permanentAddress || staff.temporaryAddress || 'N/A',
      joiningDate: this.formatDate(staff.joiningDate),
      profile: staff.imagePath || this.defaultAvatar,
      status: staff.status || 'Active',
      role: this.getDesignationName(staff.designation),
      experience: staff.experience || staff.Experience || (staff.staffExperiences?.length ? `${staff.staffExperiences.length} History Entries` : 'N/A'),
      attendance: this.attendanceStats,
      performance: {
        rating: null,
        tasksCompleted: null,
        totalTasks: null,
        studentFeedback: null,
        skills: []
      }
    };
  }

  private formatDate(value: any): string | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toLocaleDateString();
  }

  private getGenderName(gender: any): string {
    if (gender === null || gender === undefined) return 'N/A';
    if (typeof gender === 'string') return gender;
    const genders = ['Male', 'Female', 'Other'];
    return genders[gender] || 'N/A';
  }

  private getDesignationName(designation: any): string {
    if (typeof designation === 'number') {
      return Designation[designation] || 'Staff Member';
    }
    return designation || 'Staff Member';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'active';
    if (s === 'inactive') return 'inactive';
    return 'neutral';
  }

  private checkAuthorization() {
    const currentUser = this.authService.userValue;
    const isPrivileged = this.authService.hasAnyRole(['Admin', 'Principal']);
    if (this.staffData && !isPrivileged && currentUser && this.staffData.email !== currentUser.email) {
      this.router.navigate(['/unauthorized']);
    }
  }

  goBack() {
    this.router.navigate(['/staff-list']);
  }

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

  editStaff(id: number) {
    this.router.navigate(['/staff-edit-profile', id]);
  }
}
