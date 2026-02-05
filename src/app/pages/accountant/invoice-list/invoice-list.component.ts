import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '../../../services/invoice.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [BreadcrumbComponent, RouterModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.css',
})
export class InvoiceListComponent implements OnInit {
  title = 'Invoice List';
  invoices: Invoice[] = [];
  loading = true;

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.invoiceService.getInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching invoices', err);
        this.loading = false;
        // Fallback or show error
      }
    });
  }
}

