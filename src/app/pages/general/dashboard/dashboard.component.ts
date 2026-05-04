import { AfterViewInit, OnInit, OnDestroy, Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
declare var $: any;
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { DashboardService, DashboardStats } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { SectionService } from '../../../services/section.service';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Staff } from '../../../Models/staff';

@Component({
  selector: 'app-home',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  imports: [NgApexchartsModule, BreadcrumbComponent, CommonModule, RouterModule]
})
export class DashboardComponent implements AfterViewInit, OnInit, OnDestroy {
  title = 'School Dashboard';
  stats: DashboardStats | null = null;

  @ViewChild('chart') chart: ChartComponent;
  chartOptions: any;
  barChartOptions: any;
  donutChartOptions: any;
  paymentStatusChartOptions: any;

  // Teacher-specific data
  isTeacher = false;
  currentStaff: Staff | null = null;
  assignments: SubjectAssignment[] = [];
  teacherSubjectPills: { label: string; className: string; sectionName: string }[] = [];
  teacherClasses: string[] = [];
  classSectionMap: { className: string; sections: string[] }[] = [];
  totalStudents = 0;

  // Time & Greeting
  greeting = '';
  currentTime = '';
  currentDate = '';
  private timeInterval: any;

  // Quick stats for teacher
  teacherStats = [
    { label: 'Assigned Subjects', value: 0, icon: 'solar:book-bold-duotone', color: 'var(--primary-color)', bg: 'rgba(var(--primary-rgb),0.12)', pulse: false },
    { label: 'My Classes', value: 0, icon: 'solar:buildings-bold-duotone', color: 'var(--secondary-color)', bg: 'rgba(244,196,48,0.12)', pulse: false },
    { label: 'My Sections', value: 0, icon: 'solar:diploma-bold-duotone', color: 'var(--primary-color)', bg: 'rgba(var(--primary-rgb),0.12)', pulse: false },
    { label: "Today's Date", value: '', icon: 'solar:calendar-bold-duotone', color: 'var(--secondary-color)', bg: 'rgba(244,196,48,0.12)', pulse: true }
  ];

  // Quick action tiles for teachers
  quickActions = [
    { label: 'Mark Attendance', icon: 'solar:user-check-bold-duotone', route: '/attendance', color: 'var(--primary-color)', description: 'Record today\'s attendance' },
    { label: 'My Students', icon: 'solar:users-group-rounded-bold-duotone', route: '/students', color: 'var(--secondary-color)', description: 'View class students' },
    { label: 'Exam Schedule', icon: 'solar:calendar-mark-bold-duotone', route: '/exam-schedule', color: 'var(--primary-color)', description: 'Check upcoming exams' },
    { label: 'Exam Results', icon: 'solar:chart-bold-duotone', route: '/exam-result', color: 'var(--secondary-color)', description: 'View student results' },
    { label: 'My Leaves', icon: 'solar:document-text-bold-duotone', route: '/my-leaves', color: 'var(--primary-color)', description: 'Manage leave requests' },
    { label: 'Apply Leave', icon: 'solar:pen-new-round-bold-duotone', route: '/apply-leave', color: 'var(--secondary-color)', description: 'Submit new leave request' },
  ];

  adminQuickActions = [
    { label: '1. New Admission', icon: 'solar:user-plus-bold', route: '/student-add', color: 'var(--primary-color)', description: 'Enroll new students into classes' },
    { label: '2. Add Classes', icon: 'solar:buildings-bold-duotone', route: '/class-list', color: 'var(--secondary-color)', description: 'Set up class structure' },
    { label: '3. Add Sections', icon: 'solar:diploma-bold-duotone', route: '/section-add', color: 'var(--primary-color)', description: 'Create sections within classes' },
    { label: '4. Add Subjects', icon: 'solar:book-2-bold-duotone', route: '/subject-add', color: 'var(--secondary-color)', description: 'Define subjects to be taught' },
    { label: '5. Add Staff', icon: 'solar:user-speak-bold-duotone', route: '/staff-add', color: 'var(--primary-color)', description: 'Register teachers & employees' },
    { label: '6. Assign Subjects', icon: 'solar:link-bold-duotone', route: '/subject-assignment', color: 'var(--secondary-color)', description: 'Map subjects to staff & sections' },
  ];

  principalQuickActions = [
    { label: '1. Student List', icon: 'solar:users-group-rounded-bold-duotone', route: '/student-list', color: 'var(--primary-color)', description: 'Browse all student records' },
    { label: '2. Staff List', icon: 'solar:user-speak-bold-duotone', route: '/staff-list', color: 'var(--secondary-color)', description: 'Browse team directory' },
    { label: '3. Student Attendance', icon: 'solar:user-check-bold-duotone', route: '/attendance', color: 'var(--primary-color)', description: 'Check student presence' },
    { label: '4. Staff Attendance', icon: 'solar:calendar-mark-bold-duotone', route: '/staff-attendance', color: 'var(--secondary-color)', description: 'Daily staff presence list' },
    { label: '5. Manage Leaves', icon: 'solar:calendar-date-bold-duotone', route: '/manage-leaves', color: 'var(--primary-color)', description: 'Review & approve absences' },
    { label: '6. Exam Analytics', icon: 'solar:chart-bold-duotone', route: '/exam-analytics', color: 'var(--secondary-color)', description: 'Deep dive into results' },
  ];

  accountantQuickActions = [
    { label: '1. Create Fee Type', icon: 'solar:bill-list-bold-duotone', route: '/fee', color: 'var(--primary-color)', description: 'Define fee categories first' },
    { label: '2. Generate Fee Invoice', icon: 'solar:document-text-bold-duotone', route: '/generate-fee-invoice', color: 'var(--secondary-color)', description: 'Issue invoices to students' },
    { label: '3. Collect Fee', icon: 'solar:wallet-money-bold-duotone', route: '/collect-fee', color: 'var(--primary-color)', description: 'Record student payments' },
    { label: '4. Pay Salary', icon: 'solar:plain-2-bold-duotone', route: '/salary', color: 'var(--secondary-color)', description: 'Process staff salaries' },
    { label: '5. Salary Slip', icon: 'solar:card-send-bold-duotone', route: '/salary-slip', color: 'var(--primary-color)', description: 'View staff payroll slips' },
    { label: '6. Account Ledger', icon: 'solar:wallet-bold-duotone', route: '/accounts-ledger', color: 'var(--secondary-color)', description: 'View full financial ledger' },
  ];

  overviewStats: any[] = [];
  adminFullName: string = '';

  constructor(
    private dashboardService: DashboardService,
    public authService: AuthService,
    private staffService: StaffService,
    private assignmentService: SubjectAssignmentService,
    private sectionService: SectionService,
  ) {
    this.initCharts();
    this.updateTime();
  }

  ngOnInit() {
    this.isTeacher = this.authService.hasAnyRole(['Teacher']);
    const user = this.authService.userValue;

    if (this.isTeacher && user?.email) {
      this.loadTeacherData(user.email);
    } else {
      this.loadAdminData();
    }

    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    const now = new Date();
    const h = now.getHours();
    this.greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.teacherStats[3].value = dateStr as any;
  }

  loadTeacherData(email: string) {
    this.staffService.getStaffByEmail(email).subscribe({
      next: (staff: Staff) => {
        this.currentStaff = staff;
        forkJoin({
          assignments: this.assignmentService.getAssignmentsByTeacher(staff.staffId),
          sections: this.sectionService.getSections()
        }).subscribe({
          next: ({ assignments, sections }) => {
            this.assignments = assignments || [];
            const classTeacherSections = (sections || []).filter((s: any) => s.staffId === staff.staffId);

            // Build one pill per assignment (not deduplicated by subject name)
            this.teacherSubjectPills = this.assignments.map(a => ({
              label: a.subject?.subjectName || 'Unknown Subject',
              className: a.section?.className || '',
              sectionName: a.section?.sectionName || ''
            }));

            // Unique class names
            const classNames = new Set<string>();
            this.assignments.forEach(a => { if (a.section?.className) classNames.add(a.section.className); });
            classTeacherSections.forEach((s: any) => { if (s.className) classNames.add(s.className); });
            this.teacherClasses = [...classNames];

            // Map each class → its assigned sections (only sections for that class)
            this.classSectionMap = this.teacherClasses.map(cls => {
              const secs = new Set<string>();
              this.assignments
                .filter(a => a.section?.className === cls && a.section?.sectionName)
                .forEach(a => secs.add(a.section!.sectionName!));
              classTeacherSections
                .filter((s: any) => s.className === cls && s.sectionName)
                .forEach((s: any) => secs.add(s.sectionName));
              return { className: cls, sections: [...secs] };
            });

            // Stats
            this.teacherStats[0].value = this.teacherSubjectPills.length;  // total assignments
            this.teacherStats[1].value = this.teacherClasses.length;
            this.teacherStats[2].value = this.classSectionMap.reduce((n, c) => n + c.sections.length, 0);

            this.updateTeacherChart();
          }
        });
      }
    });
  }

  loadAdminData() {
    this.dashboardService.getStats().subscribe(data => {
      this.stats = data;
      this.overviewStats = [
        { label: 'Total Students', value: data.totalStudents, icon: 'solar:users-group-rounded-bold-duotone', color: 'var(--primary-color)', bg: 'rgba(var(--primary-rgb),0.12)' },
        { label: 'Total Teachers', value: data.totalTeachers, icon: 'solar:user-speak-bold-duotone', color: 'var(--secondary-color)', bg: 'rgba(244,196,48,0.12)' },
        { label: 'Total Staff', value: data.totalStaff, icon: 'solar:user-id-bold-duotone', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
        { label: 'Income (Month)', value: data.incomeThisMonth, icon: 'solar:wallet-money-bold-duotone', color: '#10b981', bg: 'rgba(16,185,129,0.12)', isCurrency: true },
        { label: 'Expenses (Month)', value: data.expenseThisMonth, icon: 'solar:card-send-bold-duotone', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', isCurrency: true },
        { label: 'Total Classes', value: data.totalClasses, icon: 'solar:buildings-bold-duotone', color: 'var(--primary-color)', bg: 'rgba(var(--primary-rgb),0.12)' },
        { label: 'Total Sections', value: data.totalSections, icon: 'solar:diploma-bold-duotone', color: 'var(--secondary-color)', bg: 'rgba(244,196,48,0.12)' },
        { label: 'Total Subjects', value: data.totalSubjects, icon: 'solar:book-2-bold-duotone', color: 'var(--primary-color)', bg: 'rgba(var(--primary-rgb),0.12)' }
      ];
    });
    this.dashboardService.getChartData().subscribe(data => { this.updateHistoricalCharts(data); });
    this.dashboardService.getStudentDistribution().subscribe(data => { this.updateDonutChart(data); });
    this.dashboardService.getWeeklyAdmissions().subscribe(data => { this.updateBarChart(data); });

    const user = this.authService.userValue;
    this.adminFullName = user?.fullName || user?.username || 'Administrator';
    if (user?.email && !user?.fullName) {
      this.staffService.getStaffByEmail(user.email).subscribe({
        next: (staff) => {
          if (staff && staff.staffName) {
            this.adminFullName = staff.staffName;
          }
        },
        error: () => { }
      });
    }
  }

  updateTeacherChart() {
    const subjectColors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--primary-color)', 'var(--secondary-color)', 'var(--primary-deep)', 'var(--secondary-color)'];
    const pills = this.teacherSubjectPills;
    this.donutChartOptions = {
      series: pills.map((_, i) => Math.floor(Math.random() * 30 + 10)),
      colors: subjectColors.slice(0, pills.length),
      labels: pills.map(p => p.label + (p.className ? ' · ' + p.className : '')),
      chart: { type: 'donut', height: 240, sparkline: { enabled: false } },
      legend: { show: true, position: 'bottom', fontSize: '12px' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      dataLabels: { enabled: false },
      stroke: { width: 0 }
    };
  }

  initCharts() {
    this.chartOptions = {
      series: [{ name: 'Fee Collection', data: [] }],
      chart: { height: 264, type: 'line', toolbar: { show: false } },
      stroke: { curve: 'smooth', colors: ['var(--primary-color)'], width: 3 },
      xaxis: { categories: [] }
    };
    this.barChartOptions = {
      series: [{ name: 'New Admissions', data: [] }],
      chart: { type: 'bar', height: 235, toolbar: { show: false } },
      xaxis: { categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      colors: ['var(--secondary-color)']
    };
    this.donutChartOptions = {
      series: [],
      colors: ['var(--primary-color)', 'var(--secondary-color)', 'var(--primary-color)', 'var(--secondary-color)', 'var(--primary-deep)'],
      labels: [],
      chart: { type: 'donut', height: 270, sparkline: { enabled: true } },
      legend: { show: false }
    };
    this.paymentStatusChartOptions = {
      series: [{ name: 'Income', data: [] }, { name: 'Expense', data: [] }],
      colors: ['var(--primary-color)', 'var(--secondary-color)'],
      chart: { type: 'bar', height: 250, toolbar: { show: false } },
      xaxis: { categories: [] }
    };
  }

  updateHistoricalCharts(data: any) {
    this.chartOptions = { ...this.chartOptions, series: [{ name: 'Monthly Income', data: data.income }], xaxis: { ...this.chartOptions.xaxis, categories: data.labels } };
    this.paymentStatusChartOptions = { ...this.paymentStatusChartOptions, series: [{ name: 'Income', data: data.income }, { name: 'Expense', data: data.expense }], xaxis: { ...this.paymentStatusChartOptions.xaxis, categories: data.labels } };
  }

  updateDonutChart(data: any[]) {
    this.donutChartOptions = { ...this.donutChartOptions, series: data.map(d => d.count), labels: data.map(d => d.className) };
  }

  updateBarChart(data: any) {
    this.barChartOptions = { ...this.barChartOptions, series: [{ name: 'New Admissions', data: data.data }], xaxis: { ...this.barChartOptions.xaxis, categories: data.labels } };
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  ngAfterViewInit(): void {
    if (!this.isTeacher) {
      try {
        $('#world-map').vectorMap({
          map: 'world_mill_en', backgroundColor: 'transparent', borderColor: '#fff', borderOpacity: 0.25,
          borderWidth: 0, color: '#000000',
          regionStyle: { initial: { fill: '#E2E8F0' } },
          series: { regions: [{ values: { US: 'var(--primary-color)', SA: 'var(--primary-color)', AU: 'var(--primary-color)', CN: 'var(--primary-color)', GB: 'var(--primary-color)', PK: 'var(--primary-color)', IN: 'var(--primary-color)' }, attribute: 'fill' }] },
          zoomOnScroll: false, enableZoom: false, hoverColor: 'var(--primary-color)',
        });
      } catch (e) { }
    }
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }
}
