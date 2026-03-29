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
import { PopupService } from '../../../services/popup.service';

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

  // State
  newClass: Standard = new Standard();
  isProcessing = false;

  constructor(
    private router: Router,
    private standardService: StandardService,
    private staffService: StaffService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadTeachers();
    // Load existing classes from API (optional)
    this.loadStandards();
  }

  loadTeachers(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (data) => {
        this.teachers = data.filter(s => {
          const d = s.designation?.toString().toLowerCase();
          return d === 'teacher' || s.designation === Designation.Teacher || s.department?.departmentName === 'Teacher';
        });
        if (this.teachers.length === 0) this.teachers = data;
      },
      error: () => this.popup.error('Could not load teachers.')
    });
  }

  loadStandards() {
    this.standardService.getStandards().subscribe({
      next: (res) => { this.standards = res; },
      error: () => this.popup.error('Could not load classes.')
    });
  }

  onSubmit(form: any): void {
    if (form.invalid) {
      this.popup.warning('Please fill in all required fields.');
      return;
    }

    const payload: Standard = {
      ...this.newClass,
      standardId: 0,
      students: [],
      subjects: [],
      status: this.newClass.status || 'Active'
    };

    this.isProcessing = true;
    this.popup.loading('Creating class...');

    this.standardService.createStandard(payload).pipe(
      finalize(() => {
        this.isProcessing = false;
        this.popup.closeLoading();
      })
    ).subscribe({
      next: () => {
        this.popup.saved('Class');
        this.router.navigate(['/class-list']);
      },
      error: (err) => {
        console.error('Error creating class:', err);
        this.popup.error('Could not create class.', err?.error?.message || 'Please check your inputs and try again.');
      }
    });
  }
}
