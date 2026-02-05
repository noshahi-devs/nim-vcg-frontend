import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-preview.component.html',
  styleUrl: './invoice-preview.component.css',
})
export class InvoicePreviewComponent implements OnInit {
  title = 'Invoice Preview';
  invoice: any;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    const type = this.route.snapshot.queryParams['type'] || 'monthly'; // Optional: if type is passed

    if (id) {
      this.invoiceService.getInvoiceDetails(type, id).subscribe({
        next: (data) => {
          this.invoice = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  printInvoice() {
    window.print();
  }
}

