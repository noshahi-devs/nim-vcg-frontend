// collect-fee.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-collect-fee',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './collect-fee.component.html'
})
export class CollectFeeComponent{
  // title = 'Collect Fee';

  // search = '';
  // invoices: Invoice[] = [];
  // selectedInvoice?: Invoice;
  // paymentAmount = 0;
  // paymentMethod = 'Cash';

  // constructor(private feeSvc: FeeService, private router: Router) {}

  // ngOnInit(): void { this.loadInvoices(); }

  // loadInvoices() {
  //   this.feeSvc.getInvoices().subscribe(r => this.invoices = r);
  // }

  // findInvoice(id: number) {
  //   this.feeSvc.getInvoiceById(id).subscribe(inv => this.selectedInvoice = inv);
  // }

  // selectInvoice(inv: Invoice) {
  //   this.selectedInvoice = inv;
  //   this.paymentAmount = inv.balance;
  // }

  // collectPayment() {
  //   if (!this.selectedInvoice) { Swal.fire('Select invoice','Please select an invoice','warning'); return; }
  //   if (this.paymentAmount <= 0) { Swal.fire('Invalid amount','Enter amount > 0','warning'); return; }
  //   this.feeSvc.updateInvoicePayment(this.selectedInvoice.id, this.paymentAmount).subscribe(updated => {
  //     Swal.fire({ icon:'success', title:'Payment Collected', text:`${this.paymentAmount} collected.` }).then(() => {
  //       // navigate to slip with invoice id
  //       this.router.navigate(['/fee-slip', updated!.id]);
  //     });
  //     this.loadInvoices();
  //     this.selectedInvoice = undefined;
  //     this.paymentAmount = 0;
  //   });
  // }
}
