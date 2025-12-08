// fee.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Student {
  id: number;
  studentId: string;
  name: string;
  className: string;
  section: string;
  phone?: string;
}

export interface FeeStructure {
  className: string;
  baseFee: number;
  otherFunds: { name: string; amount: number }[];
}

export interface Invoice {
  id: number;
  invoiceNo: string;
  studentId: number;
  studentName: string;
  className: string;
  section: string;
  month: string;
  totalFee: number;
  paidAmount: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FeeService {
  private students: Student[] = [
    { id: 1, studentId: 'STU-001', name: 'Ali Raza', className: 'Five', section: 'A', phone: '03001234567' },
    { id: 2, studentId: 'STU-002', name: 'Sara Khan', className: 'Five', section: 'B', phone: '03007654321' },
    { id: 3, studentId: 'STU-003', name: 'Fatima Noor', className: 'Six', section: 'A', phone: '03005556677' }
  ];

  private feeStructures: FeeStructure[] = [
    { className: 'Five', baseFee: 4500, otherFunds: [{ name: 'Exam Fund', amount: 300 }, { name: 'Paper Fund', amount: 200 }] },
    { className: 'Six', baseFee: 5000, otherFunds: [{ name: 'Exam Fund', amount: 300 }, { name: 'Lab Fund', amount: 200 }] }
  ];

  private invoices: Invoice[] = [
    // sample invoice
    {
      id: 1,
      invoiceNo: 'INV-2025-001',
      studentId: 1,
      studentName: 'Ali Raza',
      className: 'Five',
      section: 'A',
      month: '2025-11',
      totalFee: 5000,
      paidAmount: 2000,
      balance: 3000,
      status: 'Partial',
      createdAt: '2025-11-05'
    }
  ];

  constructor() {}

  getStudents(): Observable<Student[]> { return of(this.students); }
  getStudentsFiltered(className?: string, section?: string, query?: string): Observable<Student[]> {
    const q = (query || '').toLowerCase();
    const list = this.students.filter(s => (!className || s.className === className) && (!section || s.section === section) &&
      (!q || s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)));
    return of(list);
  }

  getFeeStructureByClass(className: string): Observable<FeeStructure | undefined> {
    return of(this.feeStructures.find(f => f.className === className));
  }

  createInvoice(invoice: Partial<Invoice>): Observable<Invoice> {
    const newInv: Invoice = {
      id: this.invoices.length + 1,
      invoiceNo: `INV-${new Date().getFullYear()}-${String(this.invoices.length + 1).padStart(3,'0')}`,
      studentId: invoice.studentId!,
      studentName: invoice.studentName!,
      className: invoice.className!,
      section: invoice.section!,
      month: invoice.month || '',
      totalFee: invoice.totalFee || 0,
      paidAmount: invoice.paidAmount || 0,
      balance: (invoice.totalFee || 0) - (invoice.paidAmount || 0),
      status: (invoice.paidAmount || 0) >= (invoice.totalFee || 0) ? 'Paid' : ((invoice.paidAmount || 0) > 0 ? 'Partial' : 'Unpaid'),
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.invoices.unshift(newInv);
    return of(newInv);
  }

  getInvoices(): Observable<Invoice[]> { return of(this.invoices); }

  getInvoiceById(id: number): Observable<Invoice | undefined> {
    return of(this.invoices.find(i => i.id === id));
  }

  updateInvoicePayment(invoiceId: number, paidAmount: number): Observable<Invoice | undefined> {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.paidAmount = Number((inv.paidAmount + paidAmount));
      inv.balance = Number((inv.totalFee - inv.paidAmount));
      if (inv.balance <= 0) { inv.status = 'Paid'; inv.balance = 0; } else if (inv.paidAmount > 0) inv.status = 'Partial';
    }
    return of(inv);
  }

  getDefaulters(minBalance = 1): Observable<Invoice[]> {
    return of(this.invoices.filter(i => i.balance >= minBalance));
  }
}
