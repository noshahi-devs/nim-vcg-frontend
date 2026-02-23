import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, NgForm, FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';


import { Router } from '@angular/router';
import { GradesSystem, MarksEntry, PassFailStatus, StudentMarksDetails } from '../../../Models/marks-entry';
import { ExamScheduleVm } from '../../../Models/exam-schedule-vm';
import { Staff } from '../../../Models/staff';
import { Examtype } from '../../../Models/examtype';
import { Subject } from '../../../Models/subject';
import { Standard } from '../../../Models/standard';
import { Student } from '../../../Models/student';
import { MarkEntryService } from '../../../services/marks-entry.service';
import { StaffService } from '../../../services/staff.service';
import { StudentService } from '../../../services/student.service';
import { ExamScheduleService } from '../../../services/exam-schedule.service';
import { ExamtypeService } from '../../../services/examtype.service';
import { SubjectService } from '../../../services/subject.service';
import { StandardService } from '../../../services/standard.service';
import { ExamSchedule } from '../../../Models/exam-schedule';
import { CommonModule, NgForOf } from "@angular/common";
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-mark-entry',
  templateUrl: './marks-entry.component.html',
  styleUrl: './marks-entry.component.css',
  standalone: true,
  imports: [FormsModule, NgForOf, CommonModule, BreadcrumbComponent]
})
export class MarksEntryComponent implements OnInit {
  title = 'Marks Entry';

  @ViewChild("entryForm") entryForm!: NgForm;
  //@ViewChild("LoadData") LoadData!: HTMLElement;

  markEntry: MarksEntry = new MarksEntry();

  //studentMarksDetails: StudentMarksDetails[] = [];

  staffList: Staff[] = [];

  examSchedules: ExamSchedule = new ExamSchedule();

  examtypes: Examtype[] = [];

  subjects: Subject[] = [];

  standards: Standard[] = [];

  students: Student[] = [];


  examSchedulesVM: ExamScheduleVm[] = [];

  // Define a property to hold enum values for the select dropdown
  gradesSystemValues = Object.keys(GradesSystem).filter(key => isNaN(+key));

  passFailStatusValues = Object.values(PassFailStatus);
  loading: any;


  constructor(
    private fb: FormBuilder,
    private markEntryService: MarkEntryService,
    private staffService: StaffService,
    private studentService: StudentService,
    private examScheduleService: ExamScheduleService,
    private examtypeService: ExamtypeService,
    private subjectService: SubjectService,
    private standardService: StandardService,
    private router: Router) { }

  ngOnInit(): void {
    this.initializeForm();

    this.standardService.getStandards().subscribe((depts: Standard[]) => this.standards = depts);



    this.staffService.getAllStaffs().subscribe((depts: Staff[]) => this.staffList = depts);

    this.subjectService.getSubjects().subscribe((depts: Subject[]) => this.subjects = depts);


    this.examScheduleService.GetExamSchedules().subscribe((depts: ExamScheduleVm[]) => this.examSchedulesVM = depts);

    this.examtypeService.GetdbsExamType().subscribe((salaries: Examtype[]) => this.examtypes = salaries);
  }

  onSubmit(): void {
    if (this.entryForm.valid) {
      //alert(JSON.stringify(this.markEntry));
      //return;
      this.markEntryService.createMarkEntry(this.markEntry).subscribe(
        (response) => {
          Swal.fire({
            title: 'Submitted!',
            text: 'Student grades have been successfully recorded.',
            icon: 'success',
            confirmButtonColor: '#487FFF',
            confirmButtonText: 'Okay'
          }).then(() => {
            this.entryForm.resetForm();
            this.router.navigate(['/marksentrynewList']);
          });
        },
        (error) => {
          console.error('Error creating Mark Entry:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to save student grades. Please try again.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
          });
        }
      );
    }
  }

  initializeForm(): void {

  }



  loadStudentsMark(): void {
    this.markEntryService.GetStudents(this.markEntry).subscribe(
      (students) => {
        this.markEntry.studentMarksDetails.length = 0;
        this.markEntry.studentMarksDetails = students;
      },
      (error) => {
        console.error('Error fetching students:', error);
      }
    );
  }
}
