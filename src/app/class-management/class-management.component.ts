import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

interface ClassData {
  createdOn?: any;
  id: number;
  className: string;
  classCode: string;
  teacherId: number;
  teacherName: string;
  level: string;
  sectionsCount: number;
  studentsCount: number;
  roomNo?: string;
  totalCapacity?: number;
  subjects: string[];
  sections: string[];
  remarks?: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './class-management.component.html',
  styleUrls: ['./class-management.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClassManagementComponent implements OnInit {
  title = 'Class Management';

  // ✅ Main data lists
  classes: ClassData[] = [];
  filteredClasses: ClassData[] = [];
  paginatedClasses: ClassData[] = [];

  // ✅ Pagination + Search
  searchTerm = '';
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;

  // ✅ Form / Dialog state
  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;
  selectedClass: ClassData | null = null;

  // ✅ Form model
  classForm: any = {
    id: 0,
    className: '',
    classCode: '',
    teacherId: 0,
    teacherName: '',
    level: '',
    roomNo: '',
    totalCapacity: 0,
    studentsCount: 0,
    sectionsCount: 0,
    subjects: '',
    sections: '',
    remarks: '',
    status: 'Active'
  };

  // ✅ Dropdown data
  teachers = [
    { id: 1, name: 'Ali Khan' },
    { id: 2, name: 'Sara Ahmed' },
    { id: 3, name: 'Bilal Hussain' },
  ];

  classLevels = [
    { label: 'Primary', value: 'Primary' },
    { label: 'Middle', value: 'Middle' },
    { label: 'Secondary', value: 'Secondary' },
  ];

  subjects = [
    { name: 'English' },
    { name: 'Math' },
    { name: 'Science' },
    { name: 'Urdu' },
  ];

  sections = [
    { name: 'Section A' },
    { name: 'Section B' },
    { name: 'Section C' },
  ];

  // Expose Math to template
  Math = Math;

  ngOnInit() {
    this.loadClasses();
  }

  // ✅ Load Data (Mocked for now — replace with API later)
  loadClasses() {
    this.classes = [
      {
        id: 1,
        className: '10',
        classCode: 'C10',
        teacherId: 1,
        teacherName: 'Ali Khan',
        level: 'Secondary',
        sectionsCount: 3,
        studentsCount: 75,
        subjects: ['English', 'Math', 'Science'],
        sections: ['Section A', 'Section B', 'Section C'],
        remarks: 'Science Stream',
        status: 'Active'
      },
      {
        id: 2,
        className: '8',
        classCode: 'C08',
        teacherId: 2,
        teacherName: 'Sara Ahmed',
        level: 'Middle',
        sectionsCount: 2,
        studentsCount: 60,
        subjects: ['Urdu', 'Math', 'Science'],
        sections: ['Section A', 'Section B'],
        status: 'Inactive'
      }
    ];

    this.filteredClasses = [...this.classes];
    this.updatePagination();
  }

  // ✅ Search
  searchClasses() {
    const term = this.searchTerm.toLowerCase();
    this.filteredClasses = this.classes.filter(c =>
      c.className.toLowerCase().includes(term) ||
      c.classCode.toLowerCase().includes(term) ||
      c.teacherName.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  // ✅ Pagination logic
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredClasses.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.paginatedClasses = this.filteredClasses.slice(start, end);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // ✅ Dialog controls
  openAddDialog() {
    this.resetForm();
    this.isEditMode = false;
    this.showAddEditDialog = true;
  }

  openEditDialog(classItem: ClassData) {
    this.classForm = { ...classItem };
    this.isEditMode = true;
    this.showAddEditDialog = true;
  }

  openViewDialog(classItem: ClassData) {
    this.selectedClass = classItem;
    this.showViewDialog = true;
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.selectedClass = null;
  }

  // ✅ Save / Update
  saveClass() {
    if (this.isEditMode) {
      const index = this.classes.findIndex(c => c.id === this.classForm.id);
      if (index !== -1) {
        const teacher = this.teachers.find(t => t.id === this.classForm.teacherId);
        this.classForm.teacherName = teacher ? teacher.name : '';
        this.classes[index] = { ...this.classForm };
      }
    } else {
      const teacher = this.teachers.find(t => t.id === this.classForm.teacherId);
      this.classForm.teacherName = teacher ? teacher.name : '';
      this.classForm.id = this.classes.length + 1;
      this.classes.push({ ...this.classForm });
    }

    this.filteredClasses = [...this.classes];
    this.updatePagination();
    this.closeDialog();
  }

  // ✅ Delete
  deleteClass(classItem: ClassData) {
    if (confirm(`Are you sure you want to delete "${classItem.className}"?`)) {
      this.classes = this.classes.filter(c => c.id !== classItem.id);
      this.filteredClasses = [...this.classes];
      this.updatePagination();
    }
  }

  // ✅ Refresh
  refreshData() {
    this.loadClasses();
  }

  // ✅ Reset form
  resetForm() {
    this.classForm = {
      id: 0,
      className: '',
      classCode: '',
      teacherId: 0,
      teacherName: '',
      level: '',
      roomNo: '',
      totalCapacity: 0,
      studentsCount: 0,
      sectionsCount: 0,
      subjects: '',
      sections: '',
      remarks: '',
      status: 'Active'
    };
  }
}
