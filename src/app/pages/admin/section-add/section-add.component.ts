import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
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
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './section-add.component.html',
  styleUrls: ['./section-add.component.css']
})
export class SectionAddComponent implements OnInit {
  title = 'Add Section';
  teachers: Staff[] = [];
  classes: Standard[] = [];

  newSection: Section = {
    sectionId: 0,
    sectionName: '',
    className: '',
    sectionCode: '',
    staffId: undefined,
    roomNo: '',
    capacity: 0
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sectionService: SectionService,
    private staffService: StaffService,
    private standardService: StandardService
  ) { }


  ngOnInit(): void {
    this.staffService.getAllStaffs().subscribe(data => {
      this.teachers = data || []; // Adjust filter as needed if you only want teachers
    });


    this.standardService.getStandards().subscribe(data => {
      this.classes = data;

      // Check for pre-filled class from query params
      this.route.queryParams.subscribe(params => {
        if (params['className']) {
          this.newSection.className = params['className'];
        }
      });
    });
  }


  async onSubmit(form: any): Promise<void> {
    if (form.invalid) {
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
      // Set section name
      this.newSection.sectionName = `Section ${this.newSection.sectionCode} - ${this.newSection.className}`;

      this.sectionService.createSection(this.newSection).subscribe({
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
