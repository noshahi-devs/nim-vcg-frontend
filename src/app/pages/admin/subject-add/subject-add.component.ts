import { MarksService } from '../../../services/marks.service';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from '../../../swal';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SubjectService } from '../../../services/subject.service';
import { Subject } from '../../../Models/subject';
import { StandardService } from '../../../services/standard.service';
import { Standard } from '../../../Models/standard';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

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

  // Premium Modal State
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;
  redirectOnClose = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private subjectService: SubjectService,
    private standardService: StandardService
  ) { }

  ngOnInit(): void {
    this.loadClasses();
    // Check if a classId was passed via query params (e.g., from class-list quick action)
    this.route.queryParams.subscribe(params => {
      if (params['classId']) {
        this.selectedClassId = Number(params['classId']);
      }
    });
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => this.classes = res,
      error: () => this.showFeedback('error', 'Sync Failed', 'Could not load academic classes.')
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
      this.showFeedback('warning', 'Action Restricted', 'At least one subject is required for registration.');
    }
  }

  async onSubmit(form: NgForm) {
    if (!this.selectedClassId) {
      this.showFeedback('warning', 'Class Required', 'Please select an academic class for these subjects.');
      return;
    }

    // Validate all subjects
    const invalidSubject = this.subjects.find(s => !s.subjectName);
    if (invalidSubject) {
      this.showFeedback('warning', 'Form Incomplete', 'Please provide names for all subject entries.');
      return;
    }

    this.isProcessing = true;

    // Save subjects to API
    const saveObservables = this.subjects.map(sub => {
      sub.standardId = this.selectedClassId!;
      return this.subjectService.createSubject(sub);
    });

    // Execute all API calls
    forkJoin(saveObservables).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: (res) => {
        this.showFeedback('success', 'Subjects Saved', `${res.length} academic subjects have been successfully registered.`, true);
      },
      error: (err) => {
        console.error('Error creating subjects:', err);
        let msg = 'Unable to save the subject information.';
        
        if (err.error) {
          if (typeof err.error === 'string' && err.error.length < 200) {
            msg = err.error;
          } else if (err.error.message && err.error.message.length < 200) {
            msg = err.error.message;
          } else if (err.error.text && err.error.text.length < 200) {
            msg = err.error.text;
          }
        } else if (err.message && err.message.length < 200 && !err.message.includes('http')) {
          msg = err.message;
        }
        
        this.showFeedback('error', 'Registration Failed', msg);
      }
    });
  }

  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string, redirect = false) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
    this.redirectOnClose = redirect;

    if (type === 'success' && redirect) {
      setTimeout(() => this.closeFeedback(), 2000);
    }
  }

  closeFeedback() {
    this.showFeedbackModal = false;
    if (this.redirectOnClose) {
      this.router.navigate(['/subject-list']);
    }
  }
}


