import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SectionService } from '../../../services/section.service';
import { StaffService } from '../../../services/staff.service';
import { StandardService } from '../../../services/standard.service';
import { PopupService } from '../../../services/popup.service';
import { Staff, Designation } from '../../../Models/staff';
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sectionService: SectionService,
    private staffService: StaffService,
    private standardService: StandardService,
    private fb: FormBuilder,
    private popup: PopupService
  ) {
    this.sectionForm = this.fb.group({
      className: ['', Validators.required],
      sectionCode: ['', Validators.required],
      staffId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.staffService.getAllStaffs().subscribe(data => {
      this.teachers = (data || []).filter(s => 
        s.designation === Designation.Teacher || 
        s.designation?.toString().toLowerCase() === 'teacher'
      );
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

  onSubmit(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      this.popup.warning('Please fill in all required fields before saving.');
      return;
    }
    
    this.popup.confirm('Save Section?', 'Are you sure you want to add this section?', 'Yes, Save', 'Cancel', 'success').then(confirmed => {
      if (confirmed) {
        this.confirmSave();
      }
    });
  }

  confirmSave(): void {
    const formValue = this.sectionForm.value;
    const newSection: Section = {
      sectionId: 0,
      sectionName: `Section ${formValue.sectionCode} - ${formValue.className}`,
      className: formValue.className,
      sectionCode: formValue.sectionCode,
      staffId: formValue.staffId
    };

    this.isSaving = true;
    this.popup.loading('Saving section...');

    this.sectionService.createSection(newSection).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.popup.closeLoading();
        this.popup.saved('Section');
        this.router.navigate(['/section-list']);
      },
      error: (err) => {
        console.error(err);
        this.popup.closeLoading();
        this.popup.error('Could not save section.', err?.error?.message || 'Please check your inputs and try again.');
      }
    });
  }
}
