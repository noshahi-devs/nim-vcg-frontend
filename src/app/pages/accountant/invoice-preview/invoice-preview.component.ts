import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-preview.component.html',
  styleUrl: './invoice-preview.component.css',
})
export class InvoicePreviewComponent implements OnInit {
  title = 'Invoice Preview';
  invoice: any = null;
  loading = true;
  invoiceType = 'monthly';
  invoiceId = 0;
  invoiceNumber = '';
  env = environment;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService
  ) { }

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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading invoice:', err);
        this.loading = false;
      }
    });
  }

  get paymentItems(): any[] {
    if (!this.invoice) return [];
    if (this.invoiceType.toLowerCase() === 'monthly') {
      return this.invoice.paymentDetails ?? [];
    }
    return this.invoice.otherPaymentDetails ?? [];
  }

  get academicMonths(): string {
    if (!this.invoice) return '';
    const months = this.invoice.academicMonths ?? this.invoice.paymentMonths ?? [];
    return months.map((m: any) => m.monthName ?? m.MonthName ?? '').filter(Boolean).join(', ');
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

  get enrollmentNo(): string | number {
    return this.invoice?.student?.enrollmentNo ?? this.invoice?.Student?.enrollmentNo ?? 'N/A';
  }

  get paymentDate(): string {
    const d = this.invoice?.paymentDate ?? this.invoice?.PaymentDate;
    return d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  }

  get totalFeeAmount(): number { return +(this.invoice?.totalFeeAmount ?? this.invoice?.TotalFeeAmount ?? 0); }
  get waver(): number { return +(this.invoice?.waver ?? this.invoice?.Waver ?? 0); }
  get previousDue(): number { return +(this.invoice?.previousDue ?? this.invoice?.PreviousDue ?? 0); }
  get totalAmount(): number { return +(this.invoice?.totalAmount ?? this.invoice?.TotalAmount ?? 0); }
  get amountPaid(): number { return +(this.invoice?.amountPaid ?? this.invoice?.AmountPaid ?? 0); }
  get amountRemaining(): number { return +(this.invoice?.amountRemaining ?? this.invoice?.AmountRemaining ?? 0); }
  get paymentStatus(): string { return this.amountRemaining <= 0 ? 'Paid' : 'Pending'; }

  printInvoice(): void {
    window.print();
  }

  downloadPDF(): void {
    window.print();
  }
}
