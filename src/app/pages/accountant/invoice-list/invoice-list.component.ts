import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '../../../services/invoice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [BreadcrumbComponent, RouterModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.css',
})
export class InvoiceListComponent implements OnInit {
  title = 'Invoice List';
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  loading = true;
  isProcessing = false;
  env = environment;

  // Stats
  totalAmount = 0;
  totalPaid = 0;
  totalPending = 0;

  // Filters & Pagination
  searchTerm = '';
  statusFilter = '';
  rowsPerPage = 10;
  currentPage = 1;

  // Modals
  showDeleteModal = false;
  invoiceToDelete: Invoice | null = null;
  
  showFeedbackModal = false;
  feedbackTitle = '';
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | 'warning' = 'success';

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.invoiceService.getInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
        this.applyFilters();
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching invoices', err);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalAmount = this.invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    this.totalPaid = this.invoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
    this.totalPending = this.totalAmount - this.totalPaid;
  }

  applyFilters(): void {
    let result = [...this.invoices];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(i => 
        i.studentName.toLowerCase().includes(term) || 
        i.invoiceNumber.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {
      result = result.filter(i => i.status === this.statusFilter);
    }

    this.filteredInvoices = result;
    this.currentPage = 1;
  }

  get paginatedInvoices(): Invoice[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredInvoices.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.rowsPerPage) || 1;
  }

  get toEntry(): number {
    return Math.min(this.currentPage * this.rowsPerPage, this.filteredInvoices.length);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  confirmDelete(invoice: Invoice): void {
    this.invoiceToDelete = invoice;
    this.showDeleteModal = true;
  }

  deleteInvoice(): void {
    if (!this.invoiceToDelete) return;

    this.isProcessing = true;
    this.invoiceService.deleteInvoice(this.invoiceToDelete.type, this.invoiceToDelete.invoiceId).subscribe({
      next: () => {
        this.invoices = this.invoices.filter(i => 
          !(i.invoiceId === this.invoiceToDelete?.invoiceId && i.type === this.invoiceToDelete?.type)
        );
        this.applyFilters();
        this.calculateStats();
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.showFeedback('Success', 'Invoice deleted successfully.', 'success');
      },
      error: (err) => {
        console.error('Error deleting invoice', err);
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.showFeedback('Error', 'Failed to delete invoice. Please try again.', 'error');
      }
    });
  }

  showFeedback(title: string, message: string, type: 'success' | 'error' | 'warning'): void {
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.feedbackType = type;
    this.showFeedbackModal = true;
  }

  closeFeedback(): void {
    this.showFeedbackModal = false;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/user.png';
  }

  getStudentImage(invoice: Invoice): string {
    const path = invoice.imagePath;
    if (!path) return 'assets/images/user.png';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `${this.env.apiBaseUrl}/${path}`;
  }

  protected readonly Math = Math;
}

