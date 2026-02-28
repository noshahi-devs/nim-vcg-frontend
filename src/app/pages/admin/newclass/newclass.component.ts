import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';
import { StandardService } from '../../../services/standard.service';
import { StaffService } from '../../../services/staff.service';
import { Standard } from '../../../Models/standard';
import { Staff, Designation } from '../../../Models/staff';

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
          Swal.fire({
            icon: 'warning',
            title: 'No Teachers Found',
            text: 'Please add a teacher in the Staff Module before creating a class.',
          });
        }
      },
      error: (err) => {
        console.error('Error loading teachers:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load teachers.'
        });
      }
    });
  }

  loadStandards() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.standards = res;
      },
      error: () => {
        Swal.fire('Error', 'Could not load classes from API', 'error');
      }
    });
  }

  onSubmit(form: any): void {
    if (form.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Form',
        text: 'Please fill in all required fields.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Map to backend Standard model
    const payload: Standard = {
      ...this.newClass,
      standardId: 0,
      standardCapacity: this.newClass.standardCapacity?.toString() || '0',
      students: [],
      subjects: [],
      status: this.newClass.status || 'Active'
    };

    console.log('Class payload:', payload);

    this.standardService.createStandard(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Class Created!',
          text: 'The new class has been added successfully.',
          showConfirmButton: false,
          timer: 1500
        });
        setTimeout(() => this.router.navigate(['/class-list']), 1500);
      },
      error: (err) => {
        console.error('Error creating class:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create class. ' + (err.error?.message || err.message || 'Unknown error')
        });
      }
    });
  }
}
