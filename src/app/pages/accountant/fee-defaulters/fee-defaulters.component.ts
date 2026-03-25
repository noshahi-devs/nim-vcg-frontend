import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { DueBalanceService, DueBalance } from '../../../services/due-balance.service';
import { SettingsService } from '../../../services/settings.service';

interface FeeDefaulter {
  feeId: number;
  studentName: string;
  className: string;
  section: string;
  feeType: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  status: 'Critical' | 'Warning' | 'Overdue';
}

@Component({
  selector: 'app-fee-defaulters',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './fee-defaulters.component.html',
  styleUrl: './fee-defaulters.component.css'
})
export class FeeDefaultersComponent implements OnInit {
  title = 'Fee Defaulters';
  Math = Math; // Template access

  // Data
  defaulters: FeeDefaulter[] = [];
  filteredDefaulters: FeeDefaulter[] = [];

  // Filters
  searchQuery: string = '';
  selectedClass: string = 'all';
  selectedStatus: string = 'all';
  minAmount: number = 0;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Analytics
  totalDefaulters: number = 0;
  totalOutstanding: number = 0;
  criticalCount: number = 0;
  warningCount: number = 0;

  // Premium Modal States
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;
  showReminderModal = false;
  reminderDefaulter: FeeDefaulter | null = null;
  bulkMode = false;

  // Print State
  schoolInfo: any = {};
  selectedDefaulter: FeeDefaulter | null = null;

  constructor(private dueBalanceService: DueBalanceService, private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.loadSchoolInfo();
    this.loadDefaulters();
  }

  loadSchoolInfo() {
    this.settingsService.getSchoolInfo().subscribe(info => {
      this.schoolInfo = info || {};
    });
  }

  loadDefaulters(): void {
    this.isProcessing = true;
    this.dueBalanceService.getDueBalances().subscribe({
      next: (balances) => {
        this.processDefaulters(balances);
        this.applyFilters();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error loading due balances:', error);
        this.isProcessing = false;
        this.showFeedback('error', 'Update Failed', 'Synchronizing with the financial database was unsuccessful. Please check your connection.');
      }
    });
  }

  processDefaulters(balances: DueBalance[]): void {
    const today = new Date();
    this.defaulters = balances
      .filter(b => b.dueBalanceAmount > 0)
      .map(b => {
        const lastUpdate = new Date(b.lastUpdate);
        const daysOverdue = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'Critical' | 'Warning' | 'Overdue';
        if (daysOverdue > 30) status = 'Critical';
        else if (daysOverdue > 15) status = 'Warning';
        else status = 'Overdue';

        return {
          feeId: b.dueBalanceId,
          studentName: b.student ? b.student.studentName : 'Unknown Student',
          className: b.student?.standard?.standardName || 'N/A',
          section: 'A', // Defaulting
          feeType: 'Tuition Fee',
          amount: b.dueBalanceAmount,
          dueDate: b.lastUpdate as any,
          daysOverdue,
          status
        };
      });
  }

  applyFilters(): void {
    this.filteredDefaulters = this.defaulters.filter(d => {
      const matchesSearch = !this.searchQuery ||
        d.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.className.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesClass = this.selectedClass === 'all' || d.className === this.selectedClass;
      const matchesStatus = this.selectedStatus === 'all' || d.status === this.selectedStatus;
      const matchesAmount = d.amount >= this.minAmount;

      return matchesSearch && matchesClass && matchesStatus && matchesAmount;
    });

    this.calculateAnalytics();
    this.currentPage = 1;
  }

  calculateAnalytics(): void {
    this.totalDefaulters = this.filteredDefaulters.length;
    this.totalOutstanding = this.filteredDefaulters.reduce((sum, d) => sum + d.amount, 0);
    this.criticalCount = this.filteredDefaulters.filter(d => d.status === 'Critical').length;
    this.warningCount = this.filteredDefaulters.filter(d => d.status === 'Warning').length;
  }

  get paginatedDefaulters(): FeeDefaulter[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredDefaulters.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDefaulters.length / this.itemsPerPage));
  }

  get uniqueClasses(): string[] {
    return [...new Set(this.defaulters.map(d => d.className))];
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  sendReminder(defaulter: FeeDefaulter): void {
    this.reminderDefaulter = defaulter;
    this.bulkMode = false;
    this.showReminderModal = true;
  }

  confirmReminder(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    // Simulate API call for reminder
    setTimeout(() => {
      this.isProcessing = false;
      this.showReminderModal = false;
      const target = this.bulkMode ? `${this.filteredDefaulters.length} students` : `<b>${this.reminderDefaulter?.studentName}</b>`;
      this.showFeedback('success', 'Reminders Sent', `The secure payment notification has been dispatched to ${target}.`);
    }, 1500);
  }

  sendBulkReminders(): void {
    if (this.filteredDefaulters.length === 0) return;
    this.bulkMode = true;
    this.showReminderModal = true;
  }

  printVoucher(defaulter: FeeDefaulter): void {
    this.selectedDefaulter = defaulter;
    setTimeout(() => {
      window.print();
    }, 100);
  }

  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }

  exportCSV(): void {
    const headers = ['Student Name', 'Class', 'Section', 'Fee Type', 'Amount', 'Due Date', 'Days Overdue', 'Status'];
    const rows = this.filteredDefaulters.map(d => [
      d.studentName,
      d.className,
      d.section,
      d.feeType,
      d.amount.toString(),
      new Date(d.dueDate).toLocaleDateString(),
      d.daysOverdue.toString(),
      d.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fee_defaulters_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPDF(): void {
    this.showFeedback('warning', 'Feature Unavailable', 'PDF generation for financial reports is currently being optimized for high-resolution printing.');
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }
}


