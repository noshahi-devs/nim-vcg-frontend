import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Standard } from '../../../Models/standard';
import { StandardService } from '../../../services/standard.service';

declare var bootstrap: any;

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [BreadcrumbComponent, FormsModule, RouterLink, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.css']
})
export class ClassListComponent implements OnInit, AfterViewInit {

  title = 'Class List';
  searchTerm = '';
  filterSection = '';
  classToDelete: Standard | null = null;

  sections = ['A', 'B', 'C', 'D'];

  classList: Standard[] = [];

  constructor(private standardService: StandardService) { }

  ngOnInit(): void {
    this.loadClasses();
  }

  // **LOAD FROM REAL API**
  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (data) => {
        this.classList = data;
      },
      error: (err) => {
        console.error("API Load Error:", err);
      }
    });
  }

  // FILTER CLASS LIST
  get filteredClassList() {
    let list = this.classList;

    if (this.filterSection) {
      list = list.filter(c => c.section === this.filterSection);
    }

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(c =>
        c.standardName?.toLowerCase().includes(search)
      );
    }

    return list;
  }

  // OPEN DELETE MODAL
  confirmDelete(classItem: Standard) {
    this.classToDelete = classItem;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  // DELETE FROM REAL API
  deleteClass() {
    if (!this.classToDelete) return;

    this.standardService.deleteStandard(this.classToDelete.standardId).subscribe({
      next: () => {
        this.classList = this.classList.filter(c => c.standardId !== this.classToDelete!.standardId);
        this.classToDelete = null;

        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
      },
      error: (err) => {
        console.error("Delete API Error:", err);
      }
    });
  }

  ngAfterViewInit() { }
}
