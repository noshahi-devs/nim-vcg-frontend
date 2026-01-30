// import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

// interface Student {
//   id: number;
//   name: string;
//   rollNo: string;
//   class: string;
//   section: string;
//   status: string;
// }

// @Component({
//   selector: 'app-student-promote',
//   standalone: true,
//   imports: [CommonModule, FormsModule, BreadcrumbComponent],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
//   templateUrl: './student-promote.component.html',
//   styleUrls: ['./student-promote.component.css']
// })
// export class StudentPromoteComponent implements OnInit {
//   title = 'Student Promotion';
//   Math = Math;

//   students: Student[] = [];
//   filteredStudents: Student[] = [];
//   selectedStudents: number[] = [];

//   classes = ['Nursery', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
//   sections = ['A', 'B', 'C', 'D'];

//   searchTerm: string = '';
//   selectedClass: string = '';
//   selectedSection: string = '';

//   rowsPerPage: number = 10;
//   currentPage: number = 1;

//   nextClass: string = '';
//   nextSection: string = '';

//   ngOnInit(): void {
//     this.loadStudents();
//   }

//   loadStudents(): void {
//     const storedData = localStorage.getItem('studentList');
//     if (storedData) {
//       this.students = JSON.parse(storedData);
//     } else {
//       // Mock data (you’ll replace with API later)
//       this.students = [
//         { id: 1, name: 'Ali Khan', rollNo: '101', class: 'Nine', section: 'A', status: 'active' },
//         { id: 2, name: 'Sara Ahmed', rollNo: '102', class: 'Nine', section: 'A', status: 'active' },
//         { id: 3, name: 'Hassan Malik', rollNo: '103', class: 'Nine', section: 'B', status: 'inactive' },
//         { id: 4, name: 'Zara Iqbal', rollNo: '104', class: 'Ten', section: 'A', status: 'active' }
//       ];
//     }
//     this.filteredStudents = [...this.students];
//   }

//   searchStudents(): void {
//     const search = this.searchTerm.toLowerCase().trim();
//     this.filteredStudents = this.students.filter(s =>
//       (!this.selectedClass || s.class === this.selectedClass) &&
//       (!this.selectedSection || s.section === this.selectedSection) &&
//       (
//         s.name.toLowerCase().includes(search) ||
//         s.rollNo.toLowerCase().includes(search) ||
//         s.class.toLowerCase().includes(search) ||
//         s.section.toLowerCase().includes(search)
//       )
//     );
//     this.currentPage = 1;
//   }

//   filterStudents(): void {
//     this.searchStudents();
//   }

//   get paginatedStudents(): Student[] {
//     const start = (this.currentPage - 1) * this.rowsPerPage;
//     return this.filteredStudents.slice(start, start + this.rowsPerPage);
//   }

//   get totalPages(): number {
//     return Math.ceil(this.filteredStudents.length / this.rowsPerPage);
//   }

//   changePage(page: number): void {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//     }
//   }

//   toggleSelection(studentId: number): void {
//     const index = this.selectedStudents.indexOf(studentId);
//     if (index > -1) {
//       this.selectedStudents.splice(index, 1);
//     } else {
//       this.selectedStudents.push(studentId);
//     }
//   }

//   toggleAllSelections(event: any): void {
//     const checked = event.target.checked;
//     const visibleIds = this.paginatedStudents.map(s => s.id);
//     this.selectedStudents = checked
//       ? Array.from(new Set([...this.selectedStudents, ...visibleIds]))
//       : this.selectedStudents.filter(id => !visibleIds.includes(id));
//   }

//   areAllSelected(): boolean {
//     const visibleIds = this.paginatedStudents.map(s => s.id);
//     return visibleIds.length > 0 && visibleIds.every(id => this.selectedStudents.includes(id));
//   }

//   promoteSelected(): void {
//     if (!this.nextClass || !this.nextSection) {
//       alert('Please select next class and section before promoting.');
//       return;
//     }

//     this.students.forEach(student => {
//       if (this.selectedStudents.includes(student.id)) {
//         student.class = this.nextClass;
//         student.section = this.nextSection;
//       }
//     });

//     localStorage.setItem('studentList', JSON.stringify(this.students));

//     alert(`✅ ${this.selectedStudents.length} students promoted to ${this.nextClass} - ${this.nextSection}`);
//     this.selectedStudents = [];
//     this.filterStudents();
//   }

// }



import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

declare var bootstrap: any;

interface Student {
  id: number;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  status: string;
}

@Component({
  selector: 'app-student-promote',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-promote.component.html',
  styleUrls: ['./student-promote.component.css']
})
export class StudentPromoteComponent implements OnInit {
  title = 'Student Promotion';
  Math = Math;

  students: Student[] = [];
  filteredStudents: Student[] = [];
  selectedStudents: number[] = [];

  classes = ['Nursery', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  sections = ['A', 'B', 'C', 'D'];

  searchTerm: string = '';
  selectedClass: string = '';
  selectedSection: string = '';

  rowsPerPage: number = 10;
  currentPage: number = 1;

  nextClass: string = '';
  nextSection: string = '';

  private confirmationModal: any;
  private successModal: any;

  ngOnInit(): void {
    this.loadStudents();

    // Initialize Bootstrap modals
    const confirmModalEl = document.getElementById('confirmationModal');
    const successModalEl = document.getElementById('successModal');
    if (confirmModalEl) this.confirmationModal = new bootstrap.Modal(confirmModalEl);
    if (successModalEl) this.successModal = new bootstrap.Modal(successModalEl);
  }

  loadStudents(): void {
    const storedData = localStorage.getItem('studentList');
    if (storedData) {
      this.students = JSON.parse(storedData);
    } else {
      this.students = [
        { id: 1, name: 'Ali Khan', rollNo: '101', class: 'Nine', section: 'A', status: 'active' },
        { id: 2, name: 'Sara Ahmed', rollNo: '102', class: 'Nine', section: 'A', status: 'active' },
        { id: 3, name: 'Hassan Malik', rollNo: '103', class: 'Nine', section: 'B', status: 'inactive' },
        { id: 4, name: 'Zara Iqbal', rollNo: '104', class: 'Ten', section: 'A', status: 'active' }
      ];
    }
    this.filteredStudents = [...this.students];
  }

  searchStudents(): void {
    const search = this.searchTerm.toLowerCase().trim();
    this.filteredStudents = this.students.filter(s =>
      (!this.selectedClass || s.class === this.selectedClass) &&
      (!this.selectedSection || s.section === this.selectedSection) &&
      (
        s.name.toLowerCase().includes(search) ||
        s.rollNo.toLowerCase().includes(search) ||
        s.class.toLowerCase().includes(search) ||
        s.section.toLowerCase().includes(search)
      )
    );
    this.currentPage = 1;
  }

  filterStudents(): void {
    this.searchStudents();
  }

  get paginatedStudents(): Student[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredStudents.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  toggleSelection(studentId: number): void {
    const index = this.selectedStudents.indexOf(studentId);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(studentId);
    }
  }

  toggleAllSelections(event: any): void {
    const checked = event.target.checked;
    const visibleIds = this.paginatedStudents.map(s => s.id);
    this.selectedStudents = checked
      ? Array.from(new Set([...this.selectedStudents, ...visibleIds]))
      : this.selectedStudents.filter(id => !visibleIds.includes(id));
  }

  areAllSelected(): boolean {
    const visibleIds = this.paginatedStudents.map(s => s.id);
    return visibleIds.length > 0 && visibleIds.every(id => this.selectedStudents.includes(id));
  }

  // 🟢 Open confirmation modal before promotion
  promoteSelected(): void {
    if (!this.nextClass || !this.nextSection) {
      alert('⚠️ Please select next class and section before promoting.');
      return;
    }
    if (this.selectedStudents.length === 0) {
      alert('⚠️ Please select at least one student.');
      return;
    }

    this.confirmationModal?.show();
  }

  // 🟢 Confirm and promote students
  confirmPromotion(): void {
    this.confirmationModal?.hide();

    this.students.forEach(student => {
      if (this.selectedStudents.includes(student.id)) {
        student.class = this.nextClass;
        student.section = this.nextSection;
      }
    });

    localStorage.setItem('studentList', JSON.stringify(this.students));

    this.successModal?.show();
    this.selectedStudents = [];
    this.filterStudents();
  }
}