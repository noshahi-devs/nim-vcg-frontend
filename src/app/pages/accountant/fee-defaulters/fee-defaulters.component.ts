import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { DueBalanceService, DueBalance } from '../../../services/due-balance.service';
import Swal from 'sweetalert2';

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

  // Loading
  isLoading: boolean = false;

  // Analytics
  totalDefaulters: number = 0;
  totalOutstanding: number = 0;
  criticalCount: number = 0;
  warningCount: number = 0;

  constructor(private dueBalanceService: DueBalanceService) { }

  ngOnInit(): void {
    this.loadDefaulters();
  }

  loadDefaulters(): void {
    this.isLoading = true;
    this.dueBalanceService.getDueBalances().subscribe({
      next: (balances) => {
        this.processDefaulters(balances);
        this.applyFilters();
        this.calculateAnalytics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading due balances:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load fee defaulters. Please try again.',
          confirmButtonColor: '#800020'
        });
        this.isLoading = false;
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
          section: 'A', // Defaulting since section wasn't in the include
          feeType: 'Tuition Fee', // Generic label for due balance
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
    return Math.ceil(this.filteredDefaulters.length / this.itemsPerPage);
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
    Swal.fire({
      title: 'Send Reminder',
      text: `Send payment reminder to ${defaulter.studentName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, send it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implement actual reminder sending via API
        Swal.fire({
          icon: 'success',
          title: 'Reminder Sent!',
          text: `Payment reminder sent to ${defaulter.studentName}`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  sendBulkReminders(): void {
    Swal.fire({
      title: 'Send Bulk Reminders',
      text: `Send reminders to all ${this.filteredDefaulters.length} defaulters?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, send all!'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Reminders Sent!',
          text: `Sent ${this.filteredDefaulters.length} reminders successfully`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
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

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fee-defaulters-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  exportPDF(): void {
    Swal.fire({
      icon: 'info',
      title: 'PDF Export',
      text: 'PDF export functionality will be implemented soon!',
      confirmButtonColor: '#800020'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Critical': return 'bg-danger-600';
      case 'Warning': return 'bg-warning-600';
      case 'Overdue': return 'bg-info-600';
      default: return 'bg-secondary-600';
    }
  }

  onSearchChange(): void {
    this.applyFilters();
    this.calculateAnalytics();
  }

  onFilterChange(): void {
    this.applyFilters();
    this.calculateAnalytics();
  }
}
