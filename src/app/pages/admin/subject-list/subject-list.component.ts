import { Component, OnInit, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SubjectService } from '../../../services/subject.service';
import { Subject } from '../../../Models/subject';

declare var bootstrap: any;

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, RouterLink],
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SubjectListComponent implements OnInit, AfterViewInit {
  title = 'Subject List';
  searchTerm = '';
  filterClass = '';
  subjectToDelete: Subject | null = null;

  standards: string[] = [];
  subjectList: Subject[] = [];
  classes: string[];

  constructor(private subjectService: SubjectService) { }

  ngOnInit(): void {
    this.loadSubjects();
  }

  ngAfterViewInit(): void { }

  loadSubjects(): void {
    this.subjectService.getSubjects().subscribe({
      next: (res) => {
        this.subjectList = res;
        this.classes = [...new Set(res.map(s => s.standard?.standardName || ''))];
      },
      error: () => Swal.fire('Error', 'Failed to load subjects', 'error')
    });
  }

  get filteredSubjectList() {
    let list = this.subjectList;
    if (this.filterClass) {
      list = list.filter(s => s.standard?.standardName === this.filterClass);
    }
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        (s.subjectName?.toLowerCase().includes(search) ?? false) ||
        (s.standard?.standardName.toLowerCase().includes(search) ?? false)
      );
    }
    return list;
  }

  confirmDelete(subject: Subject): void {
    this.subjectToDelete = subject;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  deleteSubject(): void {
    if (!this.subjectToDelete) return;

    this.subjectService.deleteSubject(this.subjectToDelete.subjectId).subscribe({
      next: () => {
        this.subjectList = this.subjectList.filter(s => s.subjectId !== this.subjectToDelete?.subjectId);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Subject has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
        this.subjectToDelete = null;
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal?.hide();
      },
      error: () => Swal.fire('Error', 'Failed to delete subject', 'error')
    });
  }
}
