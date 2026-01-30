// fee-defaulters.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { FeeService } from '../../../services/fee.service';

@Component({
  selector: 'app-fee-defaulters',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './fee-defaulters.component.html'
})
export class FeeDefaultersComponent implements OnInit {
  title = 'Fee Defaulters';
  defaulters: any[] = [];
  filterClass = '';
  minBalance = 1;

  constructor(private feeSvc: FeeService) { }

  ngOnInit(): void {
    this.loadDefaulters();
  }

  loadDefaulters() {
    this.feeSvc.getAllFees().subscribe(list => this.defaulters = list);
  }

  sendReminder(inv: any) {
    alert(`Reminder sent to ${inv.studentName}`);
  }

  exportCSV() {
    const rows = [['InvoiceNo', 'Student', 'Class', 'Month', 'Balance']];
    this.defaulters.forEach(d => rows.push([d.invoiceNo, d.studentName, d.className, d.month, String(d.balance)]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'defaulters.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
