import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';
import { StandardService } from '../services/standard.service';
import { Standard } from '../Models/standard';

@Component({
  selector: 'app-new-class',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './newclass.component.html',
  styleUrls: ['./newclass.component.css']
})
export class NewClassComponent implements OnInit {

  title = 'Add Class';

  teachers: any[] = [];
  standards: Standard[] = [];

  newClass: Standard = {
    standardId: 0,
    standardName: '',
    standardCapacity: '',
    students: [],
    subjects: [],
    classTeacher: undefined,
    section: '',
    className: undefined
  };

  constructor(
    private router: Router,
    private standardService: StandardService
  ) {}

  ngOnInit(): void {
    // Load teachers from localStorage
    const staffList = JSON.parse(localStorage.getItem('staffList') || '[]');
    this.teachers = staffList.filter((s: any) => s.role === 'Teacher');

    if (this.teachers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Teachers Found',
        text: 'Please add a teacher in the Staff Module before creating a class.',
      });
    }

    // Load existing classes from API (optional)
    this.loadStandards();
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

  async onSubmit(form: any) {
  if (form.invalid) {
    Swal.fire("Error", "Please fill all fields.", "error");
    return;
  }

  const payload: Standard = {
    standardName: this.newClass.standardName,
    standardCapacity: this.newClass.standardCapacity.toString(),
    standardId: 0,
    students: [],
    subjects: [],
    classTeacher: undefined,
    section: '',
    className: undefined
  };

  this.standardService.createStandard(payload).subscribe({
    next: async () => {
      await Swal.fire({
        icon: 'success',
        text: 'Class created successfully!',
        timer: 1500,
        showConfirmButton: false
      });
      this.router.navigate(['/class-list']);
    },
    error: (err) => {
      Swal.fire("Error", "Failed to save class", "error");
      console.log(err);
    }
  });
}

}
