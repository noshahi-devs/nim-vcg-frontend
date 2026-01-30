import { MarksService } from '../../../services/marks.service';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SubjectService } from '../../../services/subject.service';
import { Subject } from '../../../Models/subject';
import { StandardService } from '../../../services/standard.service';
import { Standard } from '../../../Models/standard';

@Component({
  selector: 'app-subject-add',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './subject-add.component.html',
  styleUrls: ['./subject-add.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SubjectAddComponent implements OnInit {
  title = 'Add Subject';

  classes: Standard[] = [];
  selectedClassId: number | null = null;

  subjects: Subject[] = [
    {
      subjectId: 0, subjectName: '', subjectCode: null, standardId: null, standard: null,
      marks: undefined,
      className: undefined
    }
  ];

  constructor(
    private router: Router,
    private subjectService: SubjectService,
    private standardService: StandardService
  ) { }

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => this.classes = res,
      error: () => Swal.fire('Error', 'Failed to load classes', 'error')
    });
  }

  addMoreSubject(): void {
    this.subjects.push({
      subjectId: 0, subjectName: '', subjectCode: null, standardId: null, standard: null,
      marks: null,
      className: undefined
    });
  }

  removeSubject(index: number): void {
    if (this.subjects.length > 1) {
      this.subjects.splice(index, 1);
    } else {
      Swal.fire('Cannot Remove', 'At least one subject is required.', 'warning');
    }
  }

  async onSubmit(form: NgForm) {
    if (!this.selectedClassId) {
      Swal.fire('Class Required', 'Please select a class.', 'error');
      return;
    }

    // Validate all subjects
    const invalidSubject = this.subjects.find(s => !s.subjectName);
    if (invalidSubject) {
      Swal.fire('Form Incomplete', 'Please fill in all subject names.', 'error');
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Confirm Save',
      text: `Are you sure you want to save ${this.subjects.length} subject(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) return;

    // Save subjects to API
    const saveObservables = this.subjects.map(sub => {
      sub.standardId = this.selectedClassId!;
      return this.subjectService.createSubject(sub);
    });

    // Execute all API calls
    Promise.all(saveObservables.map(obs => obs.toPromise()))
      .then(() => {
        Swal.fire('Success', 'Subjects saved successfully!', 'success');
        this.router.navigate(['/subject-list']);
      })
      .catch(() => Swal.fire('Error', 'Failed to save subjects', 'error'));
  }
}
