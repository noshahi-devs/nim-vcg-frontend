import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from '../../../swal';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SectionService } from '../../../services/section.service';
import { StaffService } from '../../../services/staff.service';
import { StandardService } from '../../../services/standard.service';
import { Staff } from '../../../Models/staff';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';

@Component({
  selector: 'app-section-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './section-add.component.html',
  styleUrls: ['./section-add.component.css']
})
export class SectionAddComponent implements OnInit {
  title = 'Add Section';
  teachers: Staff[] = [];
  classes: Standard[] = [];

  sectionForm!: FormGroup;

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
      this.teachers = data || []; // Adjust filter as needed if you only want teachers
    });

    this.standardService.getStandards().subscribe(data => {
      this.classes = data;

      // Check for pre-filled class from query params
      this.route.queryParams.subscribe(params => {
        if (params['className']) {
          this.sectionForm.patchValue({ className: params['className'] });
        }
      });
    });
  }

  async onSubmit(): Promise<void> {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Form Incomplete',
        text: 'Please fill in all required fields before saving.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Confirm Save',
      text: 'Are you sure you want to save this section?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (confirmResult.isConfirmed) {
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

      this.sectionService.createSection(newSection).subscribe({
        next: async () => {
          await Swal.fire({
            icon: 'success',
            title: 'Section Added Successfully!',
            text: 'Redirecting to section list...',
            showConfirmButton: false,
            timer: 1800
          });
          this.router.navigate(['/section-list']);
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add section. Please try again.'
          });
          console.error(err);
        }
      });
    }
  }
}


