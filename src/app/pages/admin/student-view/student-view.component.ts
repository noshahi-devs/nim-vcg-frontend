import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
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
import { environment } from '../../../../environments/environment';
declare var $: any;
@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule],
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
        this.studentData = this.mapStudentToUi(res);
        this.loadSupplementalData();
      },
      error: (err) => console.error("Error loading student:", err)
    });
  }

  private mapStudentToUi(data: any): Student {
    if (!data) return {} as Student;

    // Normalizing Case Sensitivity (Backend PascalCase -> Frontend camelCase)
    return {
      studentId: data.studentId ?? data.StudentId,
      admissionNo: data.admissionNo ?? data.AdmissionNo,
      enrollmentNo: data.enrollmentNo ?? data.EnrollmentNo,
      uniqueStudentAttendanceNumber: data.uniqueStudentAttendanceNumber ?? data.UniqueStudentAttendanceNumber,
      studentName: data.studentName ?? data.StudentName,
      studentDOB: data.studentDOB ?? data.StudentDOB,
      studentGender: data.studentGender ?? data.StudentGender,
      studentReligion: data.studentReligion ?? data.StudentReligion,
      studentBloodGroup: data.studentBloodGroup ?? data.StudentBloodGroup,
      studentNationality: data.studentNationality ?? data.StudentNationality,
      studentNIDNumber: data.studentNIDNumber ?? data.StudentNIDNumber,
      studentContactNumber1: data.studentContactNumber1 ?? data.StudentContactNumber1,
      studentContactNumber2: data.studentContactNumber2 ?? data.StudentContactNumber2,
      studentEmail: data.studentEmail ?? data.StudentEmail,
      studentPassword: data.studentPassword ?? data.StudentPassword,
      parentEmail: data.parentEmail ?? data.ParentEmail,
      parentPassword: data.parentPassword ?? data.ParentPassword,
      permanentAddress: data.permanentAddress ?? data.PermanentAddress,
      temporaryAddress: data.temporaryAddress ?? data.TemporaryAddress,
      fatherName: data.fatherName ?? data.FatherName,
      fatherNID: data.fatherNID ?? data.FatherNID,
      fatherContactNumber: data.fatherContactNumber ?? data.FatherContactNumber,
      motherName: data.motherName ?? data.MotherName,
      motherNID: data.motherNID ?? data.MotherNID,
      motherContactNumber: data.motherContactNumber ?? data.MotherContactNumber,
      localGuardianName: data.localGuardianName ?? data.LocalGuardianName,
      localGuardianContactNumber: data.localGuardianContactNumber ?? data.LocalGuardianContactNumber,
      guardianPhone: data.guardianPhone ?? data.GuardianPhone,
      admissionDate: data.admissionDate ?? data.AdmissionDate,
      previousSchool: data.previousSchool ?? data.PreviousSchool,
      status: data.status ?? data.Status,
      section: data.section ?? data.Section,
      standardId: data.standardId ?? data.StandardId,
      imagePath: data.imagePath ?? data.ImagePath,
      imageUpload: data.imageUpload ?? data.ImageUpload,
      studentFees: data.studentFees ?? data.StudentFees ?? []
    } as Student;
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
    // 1. Check if we have a base64 image (unsaved upload or preview)
    if (this.studentData?.imageUpload?.imageData) {
      return this.studentData.imageUpload.imageData;
    }

    // 2. Check if we have a saved path from the server
    if (this.studentData?.imagePath) {
      // If it's already a full URL or base64, return as is
      if (this.studentData.imagePath.startsWith('http') || this.studentData.imagePath.startsWith('data:') || this.studentData.imagePath.startsWith('assets/')) {
        return this.studentData.imagePath;
      }
      // Otherwise prepend API base URL
      const normalizedPath = this.studentData.imagePath.replace(/\\/g, '/').replace(/^\//, '');
      
      // ⭐ Fix for live server: Use /api as fallback if apiBaseUrl is empty
      const base = environment.apiBaseUrl || '/api';
      return `${base}/${normalizedPath}`;
    }

    // 3. Fallback to default
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
