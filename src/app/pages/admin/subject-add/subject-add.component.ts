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
import { PopupService } from '../../../services/popup.service';

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
  isProcessing = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private subjectService: SubjectService,
    private standardService: StandardService,
    private popup: PopupService
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
      error: () => this.popup.error('Sync Failed', 'Could not load academic classes.')
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
      this.popup.warning('At least one subject is required for registration.', 'Action Restricted');
    }
  }

  async onSubmit(form: NgForm) {
    if (!this.selectedClassId) {
      this.popup.warning('Please select an academic class for these subjects.', 'Class Required');
      return;
    }

    // Validate all subjects
    const invalidSubject = this.subjects.find(s => !s.subjectName);
    if (invalidSubject) {
      this.popup.warning('Please provide names for all subject entries.', 'Form Incomplete');
      return;
    }

    this.isProcessing = true;
    this.popup.loading('Registering Subjects...');

    // Save subjects to API
    const saveObservables = this.subjects.map(sub => {
      sub.standardId = this.selectedClassId!;
      return this.subjectService.createSubject(sub);
    });

    // Execute all API calls
    forkJoin(saveObservables).subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.success('Subjects Saved', `${res.length} academic subjects have been successfully registered.`);
        setTimeout(() => {
          this.router.navigate(['/subject-list']);
        }, 1500);
      },
      error: (err) => {
        this.isProcessing = false;
        this.popup.closeLoading();
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
        
        this.popup.error('Registration Failed', msg);
      }
    });
  }
}


