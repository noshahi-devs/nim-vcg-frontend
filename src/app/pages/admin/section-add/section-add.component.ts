import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SectionService } from '../../../services/section.service';
import { StaffService } from '../../../services/staff.service';
import { StandardService } from '../../../services/standard.service';
import { Staff } from '../../../Models/staff';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-section-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './section-add.component.html',
  styleUrls: ['./section-add.component.css']
})
export class SectionAddComponent implements OnInit {
  title = 'Add Section';
  teachers: Staff[] = [];
  classes: Standard[] = [];

  sectionForm!: FormGroup;
  isSaving = false;

  // Premium Modal Visibility State
  showConfirmModal = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sectionService: SectionService,
    private staffService: StaffService,
    private standardService: StandardService,
    private fb: FormBuilder
  ) {
    this.sectionForm = this.fb.group({
      className: ['', Validators.required],
      sectionCode: ['', Validators.required],
      staffId: [null, Validators.required],
      roomNo: ['', Validators.required],
      capacity: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.staffService.getAllStaffs().subscribe(data => {
      this.teachers = data || [];
    });

    this.standardService.getStandards().subscribe(data => {
      this.classes = data;

      this.route.queryParams.subscribe(params => {
        if (params['className']) {
          this.sectionForm.patchValue({ className: params['className'] });
        }
      });
    });
  }

  // ── Premium Feedback ──
  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string, autoClose = false) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
    if (autoClose) {
      setTimeout(() => {
        this.showFeedbackModal = false;
        if (type === 'success') {
          this.router.navigate(['/section-list']);
        }
      }, 2200);
    }
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }

  onSubmit(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      this.showFeedback('error', 'Form Incomplete', 'Please fill in all required fields before saving.');
      return;
    }
    this.showConfirmModal = true;
  }

  cancelSave() {
    this.showConfirmModal = false;
  }

  confirmSave(): void {
    const formValue = this.sectionForm.value;
    const newSection: Section = {
      sectionId: 0,
      sectionName: `Section ${formValue.sectionCode} - ${formValue.className}`,
      className: formValue.className,
      sectionCode: formValue.sectionCode,
      staffId: formValue.staffId,
      roomNo: formValue.roomNo,
      capacity: formValue.capacity
    };

    this.isSaving = true;
    this.showConfirmModal = false;

    this.sectionService.createSection(newSection).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.showFeedback('success', 'Section Added!', 'The new section has been created successfully. Redirecting...', true);
      },
      error: (err) => {
        console.error(err);
        this.showFeedback('error', 'Error', 'Failed to add section. Please try again.');
      }
    });
  }
}
