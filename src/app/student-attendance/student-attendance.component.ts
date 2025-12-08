import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-section-add',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './section-add.component.html',
  styleUrls: ['./section-add.component.css']
})
export class SectionAddComponent implements OnInit {
  title = 'Add Section';
  teachers: any[] = [];
  classes = ['9', '10', '11', '12'];
  
  newSection = {
    sectionName: '',
    class: '',
    section: '',
    teacher: '',
    roomNo: '',
    capacity: ''
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    const staffList = JSON.parse(localStorage.getItem('staffList') || '[]');
    this.teachers = staffList.filter((s: any) => s.role === 'Teacher');

    if (this.teachers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Teachers Found',
        text: 'Please add a teacher in the Staff Module before creating a section.',
        confirmButtonText: 'OK'
      });
    }
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
      // Generate section name
      this.newSection.sectionName = `Section ${this.newSection.section} - Class ${this.newSection.class}`;
      
      // Save to localStorage
      const savedSections = JSON.parse(localStorage.getItem('sectionList') || '[]');
      const newSectionData = {
        id: savedSections.length + 1,
        ...this.newSection,
        totalStudents: 0,
        image: 'assets/images/user-grid/user-grid-img2.png'
      };
      savedSections.push(newSectionData);
      localStorage.setItem('sectionList', JSON.stringify(savedSections));

      await Swal.fire({
        icon: 'success',
        title: 'Section Added Successfully!',
        text: 'Redirecting to section list...',
        showConfirmButton: false,
        timer: 1800
      });

      // Redirect after short delay
      this.router.navigate(['/section-list']);
    }
  }

}
