import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../services/student.service';
import { StandardService } from '../../../services/standard.service';
import { AttendanceService } from '../../../services/attendance.service';
import { MarksService } from '../../../services/marks.service';
import { MonthlyPaymentService } from '../../../services/monthly-payment.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Attendance } from '../../../Models/attendance';
import { Mark } from '../../../Models/marks';
import { MonthlyPayment } from '../../../Models/monthly-payment';
import { forkJoin } from 'rxjs';
declare var $: any;
@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-view.component.html',
  styleUrl: './student-view.component.css'
})
export class StudentViewComponent implements OnInit, AfterViewInit {
  title = 'View Profile';
  studentId: number = 0;
  studentData: Student | null = null;
  classList: Standard[] = [];
  attendanceHistory: any[] = [];
  marksHistory: Mark[] = [];
  paymentHistory: MonthlyPayment[] = [];
  activeTab: string = 'personal';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private standardService: StandardService,
    private attendanceService: AttendanceService,
    private marksService: MarksService,
    private paymentService: MonthlyPaymentService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.studentId = +params['id'];
      this.loadAllData();
    });
  }

  loadAllData() {
    this.studentService.GetStudent(this.studentId).subscribe({
      next: (res) => {
        this.studentData = res;
        this.loadSupplementalData();
      },
      error: (err) => console.error("Error loading student:", err)
    });
  }

  loadSupplementalData() {
    // Load Classes
    this.standardService.getStandards().subscribe(res => this.classList = res);

    // Load Attendance (simplified for now, usually needs dates)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    this.attendanceService.getStudentAttendanceReport(
      this.studentId,
      lastMonth.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ).subscribe(res => this.attendanceHistory = res);

    // Load Marks
    this.marksService.getAllMarks().subscribe(res => {
      this.marksHistory = res.filter(m => m.studentId === this.studentId);
    });

    // Load Payments
    this.paymentService.getAllMonthlyPayments().subscribe(res => {
      this.paymentHistory = res.filter(p => p.studentId === this.studentId);
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  getClassName(id: number | null): string {
    if (!id) return 'N/A';
    const standard = this.classList.find(c => c.standardId === id);
    return standard ? standard.standardName : `Class ${id}`;
  }

  getStudentImage(): string {
    if (this.studentData?.imageUpload?.imageData) {
      return this.studentData.imageUpload.imageData;
    }
    return 'assets/images/user-grid/user-grid-img2.png';
  }

  goBack() {
    this.router.navigate(['/student-list']);
  }

  editStudent() {
    this.router.navigate(['/student-edit', this.studentId]);
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
