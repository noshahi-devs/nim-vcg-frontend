import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
declare var $: any;
@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-view.component.html',
  styleUrl: './student-view.component.css'
})
export class StudentViewComponent implements OnInit, AfterViewInit {
  editstudent(arg0: any) {
    throw new Error('Method not implemented.');
  }
  title = 'View Profile';
  studentId: number = 0;
  studentData: any = null;
  private readonly STORAGE_KEY = 'studentList';

  // Sample student data - replace with actual service call
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
    this.route.params.subscribe(params => {
      this.studentId = +params['id']; // get ID
      this.loadStudentData(); // ✅ now fetches properly
    });
  }

  loadStudentData() {
    const loadedList = this.loadStudentFromStorage();
    this.studentList = loadedList || this.studentList;
    this.studentData = this.studentList.find(student => +student.id === +this.studentId);
  }

  // Load student data from localStorage
  loadStudentFromStorage(): any[] | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  loadstudentData() {
    // Reload from localStorage or default list
    let loadedList = this.loadStudentFromStorage();

    // If localStorage data exists but doesn't have role field, clear it and use default
    if (loadedList && loadedList.length > 0 && !loadedList[0].hasOwnProperty('roleNo')) {
      localStorage.removeItem(this.STORAGE_KEY);
      loadedList = null;
    }

    this.studentList = loadedList || this.studentList;

    // Convert to number and find matching student
    this.studentData = this.studentList.find(student => +student.id === +this.studentId);
  }


  goBack() {
    // Navigate back to student list
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
}
