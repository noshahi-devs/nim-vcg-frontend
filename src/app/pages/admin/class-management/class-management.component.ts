import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StandardService } from '../../../services/standard.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectService } from '../../../services/subject.service';
import { Standard } from '../../../Models/standard';
import { Staff } from '../../../Models/staff';
import Swal from 'sweetalert2';

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
    standardId: 0,
    standardName: '',
    standardCode: '',
    gradeLevel: '',
    capacity: 0,
    fee: 0,
    remarks: ''
  };

  // ✅ Dropdown data
  teachers: Staff[] = [];

  classLevels = [
    { label: 'Primary', value: 'Primary' },
    { label: 'Middle', value: 'Middle' },
    { label: 'Secondary', value: 'Secondary' },
  ];

  subjects: any[] = [];
  sections: any[] = [];

  // Expose Math to template
  Math = Math;

  loading = false;

  constructor(
    private standardService: StandardService,
    private staffService: StaffService,
    private subjectService: SubjectService
  ) { }

  ngOnInit() {
    this.loadClasses();
    this.loadTeachers();
    this.loadSubjects();
  }

  // ✅ Load Data from API
  loadClasses() {
    this.loading = true;
    this.standardService.getStandards().subscribe({
      next: (standards: Standard[]) => {
        this.classes = standards.map(std => ({
          id: std.standardId,
          className: std.standardName || '',
          classCode: std.standardCode || '',
          level: std.gradeLevel || '',
          roomNo: std.roomNo || '',
          totalCapacity: parseInt(std.standardCapacity || '0'),
          status: (std.status as any) || 'Active',
          remarks: std.remarks || '',
          studentsCount: std.students?.length || 0,
          sectionsCount: std.subjects?.length || 0, // Mapping subjects to sections count as a placeholder if sections not joined
          teacherId: 0,
          teacherName: 'TBA',
          createdOn: new Date().toLocaleDateString(),
          sections: [],
          subjects: std.subjects?.map(s => s.subjectName || '') || []
        }));
        this.filteredClasses = [...this.classes];
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading classes:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load classes' });
        this.loading = false;
      }
    });
  }

  loadTeachers() {
    this.staffService.getAllStaffs().subscribe({
      next: (staff) => {
        this.teachers = staff;
      },
      error: (err) => console.error('Error loading teachers:', err)
    });
  }

  loadSubjects() {
    this.subjectService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects.map(s => ({ name: s.subjectName }));
      },
      error: (err) => console.error('Error loading subjects:', err)
    });
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
    const standardData: Standard = {
      standardId: this.isEditMode ? (this.classForm.id || 0) : 0,
      standardName: this.classForm.className || '',
      standardCode: this.classForm.classCode || '',
      gradeLevel: this.classForm.level || '',
      roomNo: this.classForm.roomNo || '',
      standardCapacity: (this.classForm.totalCapacity || 0).toString(),
      remarks: this.classForm.remarks || '',
      status: this.classForm.status || 'Active'
    };

    if (this.isEditMode) {
      this.standardService.updateStandard(standardData).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Updated!', text: 'Class updated successfully', timer: 1500, showConfirmButton: false });
          this.loadClasses();
          this.closeDialog();
        },
        error: (err) => {
          console.error('Error updating class:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update class' });
        }
      });
    } else {
      this.standardService.createStandard(standardData).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Created!', text: 'Class created successfully', timer: 1500, showConfirmButton: false });
          this.loadClasses();
          this.closeDialog();
        },
        error: (err) => {
          console.error('Error creating class:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create class' });
        }
      });
    }
  }

  // ✅ Delete
  deleteClass(classItem: ClassData) {
    Swal.fire({
      title: 'Delete Class?',
      text: `Are you sure you want to delete "${classItem.className}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.standardService.deleteStandard(classItem.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
            this.loadClasses();
          },
          error: (err) => {
            console.error('Error deleting class:', err);
            const errorMsg = typeof err.error === 'string' ? err.error : 'Failed to delete class';
            Swal.fire({ icon: 'error', title: 'Cannot Delete', text: errorMsg });
          }
        });
      }
    });
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
