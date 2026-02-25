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
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';


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

  sectionList: Section[] = [];
  classes: Standard[] = [];

  get totalSections(): number { return this.sectionList.length; }
  get totalCapacity(): number { return this.sectionList.reduce((acc, curr) => acc + (curr.capacity || 0), 0); }
  get assignedTeachersCount(): number { return new Set(this.sectionList.filter(s => s.staffId).map(s => s.staffId)).size; }

  constructor(
    private sectionService: SectionService,
    private standardService: StandardService,
    private authService: AuthService,
    private staffService: StaffService
  ) { }


  ngOnInit(): void {
    this.loadSections();
    this.loadClasses();
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
    this.sectionService.getSections().subscribe({
      next: (data) => {
        this.sectionList = (data || []).filter(s => s.staffId === staffId);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading filtered sections:', err);
        this.loading = false;
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
}
