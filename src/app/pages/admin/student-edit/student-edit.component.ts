import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var $: any;
declare var bootstrap: any;
@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-edit.component.html',
  styleUrl: './student-edit.component.css'
})
export class StudentEditComponent implements OnInit, AfterViewInit {
  title = 'Edit Profile';
  studentId: number = 0;
  studentData: any = null;
  private readonly STORAGE_KEY = 'studentList';

  // Modal state
  modalMessage: string = '';
  modalType: 'success' | 'error' = 'success';

  // Sample staff data - replace with actual service call
  studentList = this.loadStudentFromStorage() || [
    {
      id: 1,
      name: 'Ayesha Khan',
      rollNo: '23',
      class: '9',
      section: 'A',
      gender: 'Female',
      dob: '2009-05-15',
      phone: '0312-1234567',
      guardianName: 'Khalid Khan',
      guardianPhone: '0300-1112233',
      address: 'Lahore, Pakistan',
      admissionDate: '2024-04-10',
      previousSchool: 'Allied School',
      profile: 'assets/images/user-grid/user-grid-img2.png',
      status: 'active'
    },
    {
      id: 2,
      name: 'Bilal Ahmad',
      rollNo: '45',
      class: '10',
      section: 'B',
      gender: 'Male',
      dob: '2008-03-12',
      phone: '0321-9876543',
      guardianName: 'Tariq Ahmad',
      guardianPhone: '0311-9998877',
      address: 'Faisalabad, Pakistan',
      admissionDate: '2023-05-01',
      previousSchool: 'The Educators',
      profile: 'assets/images/user-grid/user-grid-img3.png',
      status: 'inactive'
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    // Get staff ID from route
    this.route.params.subscribe(params => {
      this.studentId = +params['id']; // + converts string to number
      this.loadStudentData();
    });
  }

  // Load staff data from localStorage
  loadStudentFromStorage(): any[] | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Save staff data to localStorage
  saveStudentToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.studentList));
  }

  // Show modal by ID
  showModal(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  loadStudentData() {
    // Reload from localStorage to get latest data
    this.studentList = this.loadStudentFromStorage() || this.studentList;
    // Find staff by ID
    this.studentData = this.studentList.find(student => student.id === this.studentId);
  }

  saveStudent() {
    if (this.studentData) {
      // Update the staff in the list
      const index = this.studentList.findIndex(s => s.id === this.studentId);
      if (index !== -1) {
        this.studentList[index] = { ...this.studentData };
      }

      // Save to localStorage
      this.saveStudentToStorage();

      // Show success modal
      this.modalMessage = 'Student information updated successfully!';
      this.modalType = 'success';
      this.showModal('messageModal');

      // Navigate back to staff list after delay
      setTimeout(() => this.router.navigate(['/student-list']), 1200);
    }
  }

  cancel() {
    // Navigate back to staff list without saving
    this.router.navigate(['/student-list']);
  }

  ngAfterViewInit() {

    $("#imageUpload").change(function () {
      this.readURL(this);
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

    this.modalType = 'success';
    this.modalMessage = 'Notification settings saved successfully!';
    const modal = new (window as any).bootstrap.Modal(document.getElementById('messageModal'));
    modal.show();
  }

}
