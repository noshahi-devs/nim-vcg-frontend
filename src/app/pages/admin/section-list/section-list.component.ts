import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SectionService } from '../../../services/section.service';
import { StandardService } from '../../../services/standard.service';
import { Section } from '../../../Models/section';
import { Standard } from '../../../Models/standard';
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

  constructor(
    private sectionService: SectionService,
    private standardService: StandardService
  ) { }

  ngOnInit(): void {
    this.loadSections();
    this.loadClasses();
  }

  loadSections(): void {
    this.loading = true;
    this.sectionService.getSections().subscribe({
      next: (data) => {
        this.sectionList = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading sections:', err);
        this.loading = false;
        // Fallback or error message
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
