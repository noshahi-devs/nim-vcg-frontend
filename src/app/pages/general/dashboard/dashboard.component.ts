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
  teacherSubjects: string[] = [];
  teacherClasses: string[] = [];
  teacherSections: string[] = [];
  totalStudents = 0;

  // Time & Greeting
  greeting = '';
  currentTime = '';
  currentDate = '';
  private timeInterval: any;

  // Quick stats for teacher
  teacherStats = [
    { label: 'Assigned Subjects', value: 0, icon: 'solar:book-bold-duotone', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', pulse: false },
    { label: 'My Classes', value: 0, icon: 'solar:buildings-bold-duotone', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', pulse: false },
    { label: 'My Sections', value: 0, icon: 'solar:diploma-bold-duotone', color: '#10b981', bg: 'rgba(16,185,129,0.12)', pulse: false },
    { label: "Today's Date", value: '', icon: 'solar:calendar-bold-duotone', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', pulse: true }
  ];

  // Quick action tiles for teachers
  quickActions = [
    { label: 'Mark Attendance', icon: 'solar:user-check-bold-duotone', route: '/attendance', color: '#6366f1', description: 'Record today\'s attendance' },
    { label: 'My Students', icon: 'solar:users-group-rounded-bold-duotone', route: '/students', color: '#0ea5e9', description: 'View class students' },
    { label: 'Exam Schedule', icon: 'solar:calendar-mark-bold-duotone', route: '/exam-schedule', color: '#10b981', description: 'Check upcoming exams' },
    { label: 'Exam Results', icon: 'solar:chart-bold-duotone', route: '/exam-result', color: '#f59e0b', description: 'View student results' },
    { label: 'My Leaves', icon: 'solar:document-text-bold-duotone', route: '/my-leaves', color: '#ec4899', description: 'Manage leave requests' },
    { label: 'Apply Leave', icon: 'solar:pen-new-round-bold-duotone', route: '/apply-leave', color: '#8b5cf6', description: 'Submit new leave request' },
  ];

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

            const subjectNames = new Set<string>();
            const classNames = new Set<string>();
            const sectionNames = new Set<string>();

            this.assignments.forEach(a => {
              if (a.subject?.subjectName) subjectNames.add(a.subject.subjectName);
              if (a.section?.className) classNames.add(a.section.className);
              if (a.section?.sectionName) sectionNames.add(a.section.sectionName);
            });

            classTeacherSections.forEach((s: any) => {
              if (s.className) classNames.add(s.className);
              if (s.sectionName) sectionNames.add(s.sectionName);
            });

            this.teacherSubjects = [...subjectNames];
            this.teacherClasses = [...classNames];
            this.teacherSections = [...sectionNames];

            this.teacherStats[0].value = this.teacherSubjects.length;
            this.teacherStats[1].value = this.teacherClasses.length;
            this.teacherStats[2].value = this.teacherSections.length;

            this.updateTeacherChart();
          }
        });
      }
    });
  }

  loadAdminData() {
    this.dashboardService.getStats().subscribe(data => { this.stats = data; });
    this.dashboardService.getChartData().subscribe(data => { this.updateHistoricalCharts(data); });
    this.dashboardService.getStudentDistribution().subscribe(data => { this.updateDonutChart(data); });
    this.dashboardService.getWeeklyAdmissions().subscribe(data => { this.updateBarChart(data); });
  }

  updateTeacherChart() {
    const subjectColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    this.donutChartOptions = {
      series: this.teacherSubjects.map((_, i) => Math.floor(Math.random() * 30 + 10)),
      colors: subjectColors.slice(0, this.teacherSubjects.length),
      labels: this.teacherSubjects,
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
      stroke: { curve: 'smooth', colors: ['#6366f1'], width: 3 },
      xaxis: { categories: [] }
    };
    this.barChartOptions = {
      series: [{ name: 'New Admissions', data: [] }],
      chart: { type: 'bar', height: 235, toolbar: { show: false } },
      xaxis: { categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
    };
    this.donutChartOptions = {
      series: [],
      colors: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'],
      labels: [],
      chart: { type: 'donut', height: 270, sparkline: { enabled: true } },
      legend: { show: false }
    };
    this.paymentStatusChartOptions = {
      series: [{ name: 'Income', data: [] }, { name: 'Expense', data: [] }],
      colors: ['#6366f1', '#f59e0b'],
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
          series: { regions: [{ values: { US: '#6366f1', SA: '#6366f1', AU: '#6366f1', CN: '#6366f1', GB: '#6366f1', PK: '#6366f1', IN: '#6366f1' }, attribute: 'fill' }] },
          zoomOnScroll: false, enableZoom: false, hoverColor: '#a5b4fc',
        });
      } catch (e) { }
    }
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }
}
