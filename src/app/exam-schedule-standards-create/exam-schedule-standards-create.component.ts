import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GetExamScheduleOptionsResponse } from '../Models/get-exam-schedule-options-response';
import { Standard } from '../Models/standard';
import { Subject } from '../Models/subject';
import { Examtype } from '../Models/examtype';
import { CreateExamScheduleStandardVM } from '../Models/create-exam-schedule-standard-vm';
import { ExamScheduleService } from '../services/exam-schedule.service';
import { ExamtypeService } from '../services/examtype.service';
import { StandardService } from '../services/standard.service';
import { SubjectService } from '../services/subject.service';
import { ExamScheduleStandardService } from '../services/exam-schedule-standard.service';
import { BreadcrumbComponent } from "../breadcrumb/breadcrumb.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-exam-schedule-standards-create',
  templateUrl: './exam-schedule-standards-create.component.html',
  styleUrls: ['./exam-schedule-standards-create.component.css'],
    imports: [BreadcrumbComponent, CommonModule, FormsModule]
})
export class ExamScheduleStandardsCreateComponent implements OnInit {

  title = "Create Exam Schedule Standard";

  examScheduleList: GetExamScheduleOptionsResponse[] = [];
  standardList: Standard[] = [];
  subjectList: Subject[] = [];
  examTypeList: Examtype[] = [];

  model: CreateExamScheduleStandardVM = new CreateExamScheduleStandardVM();

  constructor(
    private examScheduleService: ExamScheduleService,
    private examTypeService: ExamtypeService,
    private standardService: StandardService,
    private subjectService: SubjectService,
    private examScheduleStandardsService: ExamScheduleStandardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExamSchedules();
    this.loadStandards();
    this.loadSubjects();
    this.loadExamTypes();

    // Add one initial subject row
    this.addExamSubject();
  }

  loadExamSchedules() {
    this.examScheduleService.GetExamScheduleOptions().subscribe(data => this.examScheduleList = data);
  }

  loadStandards() {
    this.standardService.getStandards().subscribe(data => this.standardList = data);
  }

  loadSubjects() {
    this.subjectService.getSubjects().subscribe(data => this.subjectList = data);
  }

  loadExamTypes() {
    this.examTypeService.GetdbsExamType().subscribe(data => this.examTypeList = data);
  }

  addExamSubject() {
    this.model.examSubjects.push({
      subjectId: 0,
      examTypeId: 0,
      examDate: new Date(),
      examStartTime: '',
      examEndTime: ''
    });
  }

  deleteExamSubject(index: number) {
    this.model.examSubjects.splice(index, 1);
  }

  onSubmit() {
    console.log(this.model);
    this.examScheduleStandardsService.SaveExamScheduleStandards(this.model).subscribe({
      next: () => this.router.navigate(['/exam-schedule-standards-list']),
      error: err => console.log(err)
    });
  }
}
