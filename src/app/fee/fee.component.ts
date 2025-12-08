// import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';

interface Student {
  id: number;
  name: string;
  class: string;
  section: string;
}

interface FeeStructure {
  class: string;
  totalFee: number;
  funds: number;
}

interface FeeRecord {
  id: number;
  studentId: number;
  studentName: string;
  class: string;
  section: string;
  month: string;
  paymentType: 'Full' | 'Installment' | 'Half';
  paidAmount: number;
  remainingFee: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  date: string;
}

@Component({
  selector: 'app-fee',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './fee.component.html',
})
export class FeeComponent implements OnInit {
  title = 'Fee Management';

  // Filters
  selectedClass: string = '';
  selectedSection: string = '';
  searchTerm: string = '';

  // Dropdown Data
  classes = ['Nursery', 'KG', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  sections = ['A', 'B', 'C'];

  // Student Data (mock)
  students: Student[] = [
    { id: 1, name: 'Ayesha Khan', class: 'Five', section: 'A' },
    { id: 2, name: 'Ali Raza', class: 'Five', section: 'B' },
    { id: 3, name: 'Fatima Noor', class: 'Six', section: 'A' },
  ];

  filteredStudents: Student[] = [];

  // Fee Structures (based on class)
  feeStructures: FeeStructure[] = [
    { class: 'Five', totalFee: 5000, funds: 500 },
    { class: 'Six', totalFee: 5500, funds: 600 },
  ];

  // Active Student & Fee Info
  selectedStudent: Student | null = null;
  selectedFeeStructure: FeeStructure | null = null;

  feeMonth: string = '';
  paymentType: 'Full' | 'Installment' | 'Half' = 'Full';
  paidAmount: number = 0;
  remainingFee: number = 0;

  // Fee Records
  feeRecords: FeeRecord[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  // 🔍 Filter students
  filterStudents() {
    this.filteredStudents = this.students.filter((s) => {
      return (
        (!this.selectedClass || s.class === this.selectedClass) &&
        (!this.selectedSection || s.section === this.selectedSection) &&
        (!this.searchTerm ||
          s.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    });
  }

  // 📚 Select student
  selectStudent(student: Student) {
    this.selectedStudent = student;
    this.selectedFeeStructure = this.feeStructures.find(
      (f) => f.class === student.class
    ) || null;

    if (this.selectedFeeStructure) {
      const total = this.selectedFeeStructure.totalFee + this.selectedFeeStructure.funds;
      this.remainingFee = total;
      this.paidAmount = 0;
    }
  }

  // 💰 Auto-calc remaining fee
  updateRemaining() {
    if (this.selectedFeeStructure) {
      const total = this.selectedFeeStructure.totalFee + this.selectedFeeStructure.funds;
      this.remainingFee = total - this.paidAmount;
    }
  }

  // 💾 Save Fee Record
  saveFee() {
    if (!this.selectedStudent || !this.selectedFeeStructure || !this.feeMonth) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a student and fill all required fields.',
      });
      return;
    }

    const total = this.selectedFeeStructure.totalFee + this.selectedFeeStructure.funds;
    const status =
      this.paidAmount === total
        ? 'Paid'
        : this.paidAmount === 0
        ? 'Unpaid'
        : 'Partial';

    const record: FeeRecord = {
      id: this.feeRecords.length + 1,
      studentId: this.selectedStudent.id,
      studentName: this.selectedStudent.name,
      class: this.selectedStudent.class,
      section: this.selectedStudent.section,
      month: this.feeMonth,
      paymentType: this.paymentType,
      paidAmount: this.paidAmount,
      remainingFee: this.remainingFee,
      status,
      date: new Date().toISOString().split('T')[0],
    };

    this.feeRecords.push(record);

    Swal.fire({
      icon: 'success',
      title: 'Fee Saved Successfully',
      text: `${this.selectedStudent.name}'s fee has been recorded.`,
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      // redirect to fee paid summary page
      this.router.navigate(['/fee-paid']);
    });

    this.resetForm();
  }

  resetForm() {
    this.selectedStudent = null;
    this.selectedFeeStructure = null;
    this.feeMonth = '';
    this.paymentType = 'Full';
    this.paidAmount = 0;
    this.remainingFee = 0;
  }
}
