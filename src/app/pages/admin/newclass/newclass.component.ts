import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StandardService } from '../../../services/standard.service';
import { StaffService } from '../../../services/staff.service';
import { Standard } from '../../../Models/standard';
import { Staff, Designation } from '../../../Models/staff';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-new-class',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './newclass.component.html',
  styleUrls: ['./newclass.component.css']
})
export class NewClassComponent implements OnInit {

  title = 'Create New Class';
  teachers: Staff[] = [];
  standards: Standard[] = [];

  newClass: Standard = new Standard();

  // Premium Modal State
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;
  redirectOnClose = false;

  constructor(
    private router: Router,
    private standardService: StandardService,
    private staffService: StaffService
  ) { }

  ngOnInit(): void {
    this.loadTeachers();
    // Load existing classes from API (optional)
    this.loadStandards();
  }

  loadTeachers(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (data) => {
        // Filter staff with 'Teacher' designation or department
        this.teachers = data.filter(s => {
          const d = s.designation?.toString().toLowerCase();
          return d === 'teacher' || s.designation === Designation.Teacher || s.department?.departmentName === 'Teacher';
        });
        // If no filter works, just show all
        if (this.teachers.length === 0) {
          this.teachers = data;
        }

        if (this.teachers.length === 0) {
          this.showFeedback('warning', 'No Teachers Found', 'Please add a teacher in the Staff Module before creating a class.');
        }
      },
      error: (err) => {
        console.error('Error loading teachers:', err);
        this.showFeedback('error', 'Error', 'Failed to load teachers.');
      }
    });
  }

  loadStandards() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.standards = res;
      },
      error: () => {
        this.showFeedback('error', 'Error', 'Could not load classes from API');
      }
    });
  }

  onSubmit(form: any): void {
    if (form.invalid) {
      this.showFeedback('warning', 'Invalid Form', 'Please fill in all required fields.');
      return;
    }

    // Map to backend Standard model
    const payload: Standard = {
      ...this.newClass,
      standardId: 0,
      students: [],
      subjects: [],
      status: this.newClass.status || 'Active'
    };

    console.log('Class payload:', payload);

    this.isProcessing = true;

    this.standardService.createStandard(payload).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: () => {
        this.showFeedback('success', 'Class Created!', 'The new class has been added successfully.', true);
      },
      error: (err) => {
        console.error('Error creating class:', err);
        this.showFeedback('error', 'Error', 'Failed to create class. ' + (err.error?.message || err.message || 'Unknown error'));
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
      this.router.navigate(['/class-list']);
    }
  }
}
