import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SectionService } from '../../../services/section.service';
import { StandardService } from '../../../services/standard.service';
import { Section } from '../../../Models/section';
import { Standard } from '../../../Models/standard';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { forkJoin, finalize } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from '../../../swal';


declare var bootstrap: any;

@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [BreadcrumbComponent, FormsModule, RouterLink, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './section-list.component.html',
  styleUrls: ['./section-list.component.css']
})
export class SectionListComponent implements OnInit {
  title = 'Section List';
  searchTerm = '';
  filterClass = '';
  loading = false;
  selectedSection: Section | null = null;
  editLoading = false;
  allStaff: any[] = [];

  sectionList: Section[] = [];
  classes: Standard[] = [];

  get totalSections(): number { return this.sectionList.length; }
  get totalCapacity(): number { return this.sectionList.reduce((acc, curr) => acc + (curr.capacity || 0), 0); }
  get assignedTeachersCount(): number { return new Set(this.sectionList.filter(s => s.staffId).map(s => s.staffId)).size; }

  constructor(
    private sectionService: SectionService,
    private standardService: StandardService,
    private authService: AuthService,
    private staffService: StaffService,
    private assignmentService: SubjectAssignmentService
  ) { }


  ngOnInit(): void {
    this.loadSections();
    this.loadClasses();
    this.loadStaff();
  }

  loadStaff(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (res) => this.allStaff = res,
      error: () => console.error('Failed to load staff')
    });
  }

  loadSections(): void {
    this.loading = true;
    const isTeacher = this.authService.hasAnyRole(['Teacher']);
    const currentUser = this.authService.userValue;

    if (isTeacher && currentUser?.email) {
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) {
            this.fetchAndFilterSections(staff.staffId);
          } else {
            this.fetchAllSectionsRaw();
          }
        },
        error: () => this.fetchAllSectionsRaw()
      });
    } else {
      this.fetchAllSectionsRaw();
    }
  }

  private fetchAllSectionsRaw(): void {
    this.sectionService.getSections().subscribe({
      next: (data) => {
        this.sectionList = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading sections:', err);
        this.loading = false;
      }
    });
  }

  private fetchAndFilterSections(staffId: number): void {
    forkJoin({
      sections: this.sectionService.getSections(),
      assignments: this.assignmentService.getAssignmentsByTeacher(staffId)
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        const classTeacherSections = res.sections.filter(s => s.staffId === staffId);
        const assignedSectionIds = res.assignments.map(a => a.sectionId);
        const subjectSections = res.sections.filter(s => assignedSectionIds.includes(s.sectionId));

        // Combine sections uniquely
        const uniqueSections = new Map<number, Section>();
        classTeacherSections.forEach(s => uniqueSections.set(s.sectionId, s));
        subjectSections.forEach(s => uniqueSections.set(s.sectionId, s));

        this.sectionList = Array.from(uniqueSections.values());
      },
      error: (err) => {
        console.error('Error loading filtered sections:', err);
      }
    });
  }


  loadClasses(): void {
    this.standardService.getStandards().subscribe({
      next: (data) => {
        this.classes = data || [];
      },
      error: (err) => {
        console.error('Error loading classes:', err);
      }
    });
  }

  get filteredSectionList() {
    let list = this.sectionList;
    if (this.filterClass) {
      list = list.filter(s => s.className === this.filterClass);
    }
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        s.sectionName?.toLowerCase().includes(search) ||
        s.classTeacher?.staffName?.toLowerCase().includes(search) ||
        s.roomNo?.toLowerCase().includes(search)
      );
    }
    return list;
  }

  confirmDelete(sectionItem: Section) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete section "${sectionItem.sectionName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteSection(sectionItem.sectionId);
      }
    });
  }

  deleteSection(id: number) {
    this.sectionService.deleteSection(id).subscribe({
      next: () => {
        this.sectionList = this.sectionList.filter(s => s.sectionId !== id);
        Swal.fire('Deleted!', 'Section has been deleted.', 'success');
      },
      error: (err) => {
        console.error('Error deleting section:', err);
        Swal.fire('Error', 'Failed to delete section.', 'error');
      }
    });
  }

  openViewModal(section: Section): void {
    this.selectedSection = { ...section };
    const modal = new bootstrap.Modal(document.getElementById('viewSectionModal'));
    modal.show();
  }

  openEditModal(section: Section): void {
    this.selectedSection = { ...section };
    const modal = new bootstrap.Modal(document.getElementById('editSectionModal'));
    modal.show();
  }

  updateSection(): void {
    if (!this.selectedSection) return;
    if (!this.selectedSection.sectionName || !this.selectedSection.className) {
      Swal.fire('Error', 'Please fill required fields', 'error');
      return;
    }

    this.editLoading = true;
    this.sectionService.updateSection(this.selectedSection.sectionId, this.selectedSection).pipe(
      finalize(() => this.editLoading = false)
    ).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Section has been updated successfully.',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadSections();
        const modal = bootstrap.Modal.getInstance(document.getElementById('editSectionModal'));
        modal?.hide();
      },
      error: () => Swal.fire('Error', 'Failed to update section', 'error')
    });
  }
}


