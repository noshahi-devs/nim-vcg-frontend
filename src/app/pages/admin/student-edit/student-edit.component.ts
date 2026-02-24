import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../../services/student.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-edit.component.html',
  styleUrl: './student-edit.component.css'
})
export class StudentEditComponent implements OnInit, AfterViewInit {
  studentId: number = 0;
  studentData: Student = new Student();
  classes: Standard[] = [];
  sections: Section[] = [];
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.studentId = +params['id'];
      if (this.studentId) {
        this.loadStudentData();
        this.loadFilterData();
      }
    });
  }

  loadFilterData() {
    this.standardService.getStandards().subscribe(res => this.classes = res);
    this.sectionService.getSections().subscribe(res => this.sections = res);
  }

  loadStudentData() {
    this.loading = true;
    this.studentService.GetStudent(this.studentId).subscribe({
      next: (res) => {
        this.studentData = res;
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading student:", err);
        Swal.fire('Error', 'Could not load student data', 'error');
        this.loading = false;
      }
    });
  }

  saveStudent() {
    if (this.studentData) {
      this.loading = true;
      this.studentService.UpdateStudent(this.studentData).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            title: 'Updated!',
            text: 'Student information updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/student-list']);
          });
        },
        error: (err) => {
          this.loading = false;
          console.error("Update error:", err);
          Swal.fire('Error', 'Failed to update student information', 'error');
        }
      });
    }
  }

  cancel() {
    // Navigate back to staff list without saving
    this.router.navigate(['/student-list']);
  }

  ngAfterViewInit() {

    $("#imageUpload").on('change', (event: any) => {
      this.readURL(event.target);
    });

    // ================== Password Show Hide Js Start ==========
    // Call the function
    this.initializePasswordToggle('.toggle-password');
  }
  initializePasswordToggle(toggleSelector) {
    $(toggleSelector).on('click', function () {
      $(this).toggleClass("ri-eye-off-line");
      var input = $($(this).attr("data-toggle"));
      if (input.attr("type") === "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });
  }
  readURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#imagePreview').css('background-image', 'url(' + e.target.result + ')');
        $('#imagePreview').hide();
        $('#imagePreview').fadeIn(650);
      }
      reader.readAsDataURL(input.files[0]);
    }
  }
  notificationSettings = {
    email: true,
    sms: false,
    push: true
  };

  saveNotificationSettings() {
    // Example: Save to localStorage or API
    localStorage.setItem('studentNotificationSettings', JSON.stringify(this.notificationSettings));

    Swal.fire({
      title: 'Saved!',
      text: 'Notification settings saved successfully.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

}
