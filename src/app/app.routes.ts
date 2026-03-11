import { Routes } from '@angular/router';
import { AuthGuard } from './SecurityModels/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/general/branding-home/branding-home.component').then(m => m.BrandingHomeComponent), pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/general/branding-home/branding-home.component').then(m => m.BrandingHomeComponent) },
  { path: 'sign-in', loadComponent: () => import('./pages/auth/sign-in/sign-in.component').then(m => m.SignInComponent) },
  { path: 'sign-up', loadComponent: () => import('./pages/auth/sign-up/sign-up.component').then(m => m.SignUpComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },

  {
    path: '',
    loadComponent: () => import('./pages/general/side-nav/side-nav.component').then(m => m.SideNavComponent),
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/general/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { roles: ['Admin', 'Principal', 'Teacher', 'Accountant'] } },
      { path: 'student-dashboard', loadComponent: () => import('./pages/student/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent), data: { roles: ['Student'] } },

      // Class Management
      { path: 'class-list', loadComponent: () => import('./pages/admin/class-list/class-list.component').then(m => m.ClassListComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'newclass', loadComponent: () => import('./pages/admin/newclass/newclass.component').then(m => m.NewClassComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'class-management', loadComponent: () => import('./pages/admin/class-management/class-management.component').then(m => m.ClassManagementComponent), data: { roles: ['Admin', 'Principal'] } },

      // Section Management
      { path: 'section-list', loadComponent: () => import('./pages/admin/section-list/section-list.component').then(m => m.SectionListComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'section-add', loadComponent: () => import('./pages/admin/section-add/section-add.component').then(m => m.SectionAddComponent), data: { roles: ['Admin', 'Principal'] } },

      // Staff Management
      { path: 'staff-list', loadComponent: () => import('./pages/admin/staff-list/staff-list.component').then(m => m.StaffListComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'staff-add', loadComponent: () => import('./pages/admin/staff-add/staff-add.component').then(m => m.StaffAddComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'staff-view-profile/:id', loadComponent: () => import('./pages/admin/staff-view-profile/staff-view-profile.component').then(m => m.StaffViewProfileComponent), data: { roles: ['Admin', 'Principal', 'Teacher', 'Accountant'] } },
      { path: 'staff-edit-profile/:id', loadComponent: () => import('./pages/admin/staff-edit-profile/staff-edit-profile.component').then(m => m.StaffEditProfileComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'staff-job-letter', loadComponent: () => import('./pages/admin/staff-job-letter/staff-job-letter.component').then(m => m.StaffJobLetterComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'staff-manage-login', loadComponent: () => import('./pages/admin/staff-manage-login/staff-manage-login.component').then(m => m.StaffManageLoginComponent), data: { roles: ['Admin', 'Principal'] } },

      // Attendance
      { path: 'attendance', loadComponent: () => import('./pages/admin/attendance/attendance.component').then(m => m.AttendanceComponent), data: { roles: ['Admin', 'Principal', 'Teacher'] } },
      { path: 'staff-attendance', loadComponent: () => import('./pages/admin/staff-attendance/staff-attendance.component').then(m => m.StaffAttendanceComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'staff-attendance-report', loadComponent: () => import('./pages/principal/staff-attendance-report/staff-attendance-report.component').then(m => m.StaffAttendanceReportComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'student-attendance-report', loadComponent: () => import('./pages/principal/student-attendance-report/student-attendance-report.component').then(m => m.StudentAttendanceReportComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'my-attendance', loadComponent: () => import('./pages/teacher/my-attendance/my-attendance.component').then(m => m.MyAttendanceComponent), data: { roles: ['Teacher', 'Accountant'] } },

      // Student Management
      { path: 'student-add', loadComponent: () => import('./pages/admin/student-add/student-add.component').then(m => m.StudentAddComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'student-list', loadComponent: () => import('./pages/admin/student-list/student-list.component').then(m => m.StudentListComponent), data: { roles: ['Admin', 'Principal', 'Teacher', 'Accountant'] } },
      { path: 'student-view/:id', loadComponent: () => import('./pages/admin/student-view/student-view.component').then(m => m.StudentViewComponent), data: { roles: ['Admin', 'Principal', 'Teacher'] } },
      { path: 'student-edit/:id', loadComponent: () => import('./pages/admin/student-edit/student-edit.component').then(m => m.StudentEditComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'student-promote', loadComponent: () => import('./pages/admin/student-promote/student-promote.component').then(m => m.StudentPromoteComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'student-profile', loadComponent: () => import('./pages/student/student-profile/student-profile.component').then(m => m.StudentProfileComponent), data: { roles: ['Student'] } },
      { path: 'student-attendance-view', loadComponent: () => import('./pages/student/student-attendance-view/student-attendance-view.component').then(m => m.StudentAttendanceViewComponent), data: { roles: ['Student'] } },
      { path: 'student-fee-view', loadComponent: () => import('./pages/student/student-fee-view/student-fee-view.component').then(m => m.StudentFeeViewComponent), data: { roles: ['Student'] } },
      { path: 'student-exam-results', loadComponent: () => import('./pages/student/student-exam-results/student-exam-results.component').then(m => m.StudentExamResultsComponent), data: { roles: ['Student'] } },

      // Fee & Finance
      { path: 'fee', loadComponent: () => import('./pages/accountant/fee/fee.component').then(m => m.FeeComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'generate-fee-invoice', loadComponent: () => import('./pages/accountant/generate-fee-invoice/generate-fee-invoice.component').then(m => m.GenerateFeeInvoiceComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'collect-fee', loadComponent: () => import('./pages/accountant/collect-fee/collect-fee.component').then(m => m.CollectFeeComponent), data: { roles: ['Accountant'] } }, // Admin View Only in doc, but usually need access. Doc says No Access for collection actions.
      { path: 'fee-defaulters', loadComponent: () => import('./pages/accountant/fee-defaulters/fee-defaulters.component').then(m => m.FeeDefaultersComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'accounts', loadComponent: () => import('./pages/accountant/accounts/accounts.component').then(m => m.AccountsComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'income-manage', loadComponent: () => import('./pages/accountant/income-manage/income-manage.component').then(m => m.IncomeManageComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'expense-manage', loadComponent: () => import('./pages/accountant/expense-manage/expense-manage.component').then(m => m.ExpenseManageComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'profit-loss', loadComponent: () => import('./pages/accountant/profit-loss/profit-loss.component').then(m => m.ProfitLossComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'accounts-ledger', loadComponent: () => import('./pages/accountant/accounts-ledger/accounts-ledger.component').then(m => m.AccountsLedgerComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'bank-cash', loadComponent: () => import('./pages/accountant/bank-cash/bank-cash.component').then(m => m.BankCashComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'payment-detail', loadComponent: () => import('./pages/accountant/payment-detail/payment-detail.component').then(m => m.PaymentDetailComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'monthly-payment', loadComponent: () => import('./pages/accountant/monthly-payment/monthly-payment.component').then(m => m.MonthlyPaymentComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'other-payment', loadComponent: () => import('./pages/accountant/other-payment/other-payment.component').then(m => m.OtherPaymentComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'salary', loadComponent: () => import('./pages/accountant/salary/salary.component').then(m => m.SalaryComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'salary-slip', loadComponent: () => import('./pages/accountant/salary-slip/salary-slip.component').then(m => m.SalarySlipComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'wallet', loadComponent: () => import('./pages/accountant/wallet/wallet.component').then(m => m.WalletComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'invoice-list', loadComponent: () => import('./pages/accountant/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'invoice-add', loadComponent: () => import('./pages/accountant/invoice-add/invoice-add.component').then(m => m.InvoiceAddComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'invoice-edit/:id', loadComponent: () => import('./pages/accountant/invoice-edit/invoice-edit.component').then(m => m.InvoiceEditComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'invoice-preview/:id', loadComponent: () => import('./pages/accountant/invoice-preview/invoice-preview.component').then(m => m.InvoicePreviewComponent), data: { roles: ['Admin', 'Accountant'] } },
      { path: 'payment-gateway', loadComponent: () => import('./pages/accountant/payment-gateway/payment-gateway.component').then(m => m.PaymentGatewayComponent), data: { roles: ['Admin', 'Accountant'] } },

      // Exams & Results
      { path: 'exam', loadComponent: () => import('./pages/admin/exam/exam.component').then(m => m.ExamComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'exam-schedule', loadComponent: () => import('./pages/admin/exam-schedule/exam-schedule.component').then(m => m.ExamScheduleComponent), data: { roles: ['Admin', 'Principal', 'Teacher'] } },
      { path: 'exam-schedule-standards-create', loadComponent: () => import('./pages/admin/exam-schedule-standards-create/exam-schedule-standards-create.component').then(m => m.ExamScheduleStandardsCreateComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'exam-schedule-standards-list', loadComponent: () => import('./pages/admin/exam-schedule-standards-list/exam-schedule-standards-list.component').then(m => m.ExamScheduleStandardsListComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'exam-result', loadComponent: () => import('./pages/admin/exam-result/exam-result.component').then(m => m.ExamResultComponent), data: { roles: ['Admin', 'Principal', 'Teacher'] } },
      { path: 'exam-analytics', loadComponent: () => import('./pages/principal/exam-analytics/exam-analytics.component').then(m => m.ExamAnalyticsComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'marks-entry', loadComponent: () => import('./pages/teacher/marks-entry/marks-entry.component').then(m => m.MarksEntryComponent), data: { roles: ['Teacher'] } },
      { path: 'auto-grade-calculation', loadComponent: () => import('./pages/admin/auto-grade-calculation/auto-grade-calculation.component').then(m => m.AutoGradeCalculationComponent), data: { roles: ['Admin', 'Principal'] } },

      // Leave Management
      { path: 'leave', loadComponent: () => import('./pages/admin/leave/leave.component').then(m => m.LeaveComponent), data: { roles: ['Admin', 'Principal', 'Teacher', 'Accountant'] } },
      { path: 'apply-leave', loadComponent: () => import('./pages/teacher/apply-leaves/apply-leaves.component').then(m => m.ApplyLeavesComponent), data: { roles: ['Teacher', 'Accountant'] } },
      { path: 'my-leaves', loadComponent: () => import('./pages/teacher/my-leaves/my-leaves.component').then(m => m.MyLeavesComponent), data: { roles: ['Teacher', 'Accountant'] } },
      { path: 'manage-leaves', loadComponent: () => import('./pages/admin/leave-manage/leave-manage.component').then(m => m.LeaveManageComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'leave-type', loadComponent: () => import('./pages/admin/leave-type/leave-type.component').then(m => m.LeaveTypeComponent), data: { roles: ['Admin', 'Principal'] } },

      // Subject Management
      { path: 'subject', loadComponent: () => import('./pages/admin/subject/subject.component').then(m => m.SubjectComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'subject-add', loadComponent: () => import('./pages/admin/subject-add/subject-add.component').then(m => m.SubjectAddComponent), data: { roles: ['Admin', 'Principal'] } },
      { path: 'subject-list', loadComponent: () => import('./pages/admin/subject-list/subject-list.component').then(m => m.SubjectListComponent), data: { roles: ['Admin', 'Principal', 'Teacher'] } },
      { path: 'subject-assignment', loadComponent: () => import('./pages/admin/subject-assignment/subject-assignment.component').then(m => m.SubjectAssignmentComponent), data: { roles: ['Admin', 'Principal'] } },

      // Reports
      { path: 'report', loadComponent: () => import('./pages/principal/report/report.component').then(m => m.ReportComponent), data: { roles: ['Admin', 'Principal', 'Accountant'] } },
      { path: 'class-wise-report', loadComponent: () => import('./pages/principal/class-wise-report/class-wise-report.component').then(m => m.ClassWiseReportComponent), data: { roles: ['Admin', 'Principal', 'Teacher'] } },

      // Communications & Messaging
      { path: 'email', loadComponent: () => import('./pages/ui-elements/email/email.component').then(m => m.EmailComponent), data: { roles: ['Admin', 'Principal', 'Teacher', 'Accountant'] } },
      { path: 'broadcast', loadComponent: () => import('./pages/general/broadcast/broadcast.component').then(m => m.BroadcastComponent), data: { roles: ['Admin', 'Principal'] } },

      // User Management
      { path: 'users-list', loadComponent: () => import('./pages/ui-elements/list/list.component').then(m => m.ListComponent), data: { roles: ['Admin'] } },
      { path: 'role-access', loadComponent: () => import('./pages/admin/role-access/role-access.component').then(m => m.RoleAccessComponent), data: { roles: ['Admin'] } },
      { path: 'assign-role', loadComponent: () => import('./pages/admin/assign-role/assign-role.component').then(m => m.AssignRoleComponent), data: { roles: ['Admin'] } },

      // Settings & Others
      { path: 'language', loadComponent: () => import('./pages/admin/language/language.component').then(m => m.LanguageComponent), data: { roles: ['Admin'] } },
      { path: 'theme', loadComponent: () => import('./theme/theme.component').then(m => m.ThemeComponent), data: { roles: ['Admin'] } },
      { path: 'settings', loadComponent: () => import('./pages/admin/general-settings/general-settings.component').then(m => m.GeneralSettingsComponent), data: { roles: ['Admin'] } },
      { path: 'campus-management', loadComponent: () => import('./pages/admin/campus-management/campus-management.component').then(m => m.CampusManagementComponent), data: { roles: ['Admin'] } },
      { path: 'view-profile', loadComponent: () => import('./pages/admin/staff-view-profile/staff-view-profile.component').then(m => m.StaffViewProfileComponent), data: { roles: ['Admin', 'Principal', 'Teacher', 'Accountant'] } },

      { path: 'unauthorized', loadComponent: () => import('./pages/ui-elements/error/error.component').then(m => m.ErrorComponent) },
      { path: '**', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  }
];



