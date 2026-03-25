import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-invoice-edit',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, RouterModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-edit.component.html',
  styleUrl: './invoice-edit.component.css'
})
export class InvoiceEditComponent implements OnInit {
  title = 'Invoice Edit';
  invoice: any = null;
  loading = true;
  isSaving = false;
  invoiceType = 'monthly';
  invoiceId = 0;
  invoiceNumber = '';
  env = environment;

  // Editable form fields
  paymentDate = '';
  amountPaid = 0;
  waver = 0;

  // Computed
  totalFeeAmount = 0;
  previousDue = 0;
  totalAmount = 0;
  amountRemaining = 0;

  // Feedback
  showFeedbackModal = false;
  feedbackTitle = '';
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.invoiceId = +this.route.snapshot.params['id'];
    this.invoiceType = this.route.snapshot.queryParams['type'] || 'monthly';
    this.loadInvoice();
  }

  loadInvoice(): void {
    this.loading = true;
    this.invoiceService.getInvoiceDetails(this.invoiceType, this.invoiceId).subscribe({
      next: (data) => {
        this.invoice = data;
        const prefix = this.invoiceType.toLowerCase() === 'monthly' ? 'M' : 'O';
        this.invoiceNumber = `INV-${prefix}-${String(this.invoiceId).padStart(6, '0')}`;

        // Pre-fill editable fields
        const rawDate = data.paymentDate ?? data.PaymentDate;
        this.paymentDate = rawDate ? new Date(rawDate).toISOString().substring(0, 10) : '';
        this.amountPaid = +(data.amountPaid ?? data.AmountPaid ?? 0);
        this.waver = +(data.waver ?? data.Waver ?? 0);
        this.totalFeeAmount = +(data.totalFeeAmount ?? data.TotalFeeAmount ?? 0);
        this.previousDue = +(data.previousDue ?? data.PreviousDue ?? 0);
        this.recalculate();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading invoice:', err);
        this.loading = false;
      }
    });
  }

  recalculate(): void {
    const afterWaver = this.totalFeeAmount - (this.totalFeeAmount * (this.waver / 100));
    this.totalAmount = afterWaver + this.previousDue;
    this.amountRemaining = this.totalAmount - this.amountPaid;
  }

  get studentImage(): string {
    const path = this.invoice?.student?.imagePath ?? this.invoice?.Student?.imagePath;
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `${this.env.apiBaseUrl}/${path}`;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/user.png';
  }

  get studentName(): string {
    return this.invoice?.student?.studentName ?? this.invoice?.Student?.studentName ?? 'N/A';
  }

  get standard(): string {
    return this.invoice?.student?.standard?.standardName ?? this.invoice?.Student?.standard?.standardName ?? 'N/A';
  }

  get paymentItems(): any[] {
    if (!this.invoice) return [];
    return this.invoiceType.toLowerCase() === 'monthly'
      ? (this.invoice.paymentDetails ?? [])
      : (this.invoice.otherPaymentDetails ?? []);
  }

  get academicMonths(): string {
    if (!this.invoice) return '';
    const months = this.invoice.academicMonths ?? this.invoice.paymentMonths ?? [];
    return months.map((m: any) => m.monthName ?? m.MonthName ?? '').filter(Boolean).join(', ');
  }

  saveInvoice(): void {
    if (!this.invoice) return;
    this.isSaving = true;

    // Build a partial update payload from the existing invoice data + editable fields
    const payload = {
      ...this.invoice,
      paymentDate: this.paymentDate || this.invoice.paymentDate || this.invoice.PaymentDate,
      amountPaid: this.amountPaid,
      waver: this.waver,
    };

    // Ensure the ID fields are set correctly based on invoice type
    if (this.invoiceType.toLowerCase() === 'monthly') {
      payload.monthlyPaymentId = this.invoiceId;
    } else {
      payload.othersPaymentId = this.invoiceId;
    }

    this.invoiceService.updatePayment(this.invoiceType, this.invoiceId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.showFeedback('Saved!', 'Invoice updated successfully.', 'success');
      },
      error: (err) => {
        console.error('Error saving invoice:', err);
        this.isSaving = false;
        this.showFeedback('Error', 'Failed to save invoice. Please try again.', 'error');
      }
    });
  }

  showFeedback(title: string, message: string, type: 'success' | 'error'): void {
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.feedbackType = type;
    this.showFeedbackModal = true;
  }

  closeFeedback(): void {
    this.showFeedbackModal = false;
    if (this.feedbackType === 'success') {
      this.router.navigate(['/invoice-preview', this.invoiceId], { queryParams: { type: this.invoiceType } });
    }
  }
}
