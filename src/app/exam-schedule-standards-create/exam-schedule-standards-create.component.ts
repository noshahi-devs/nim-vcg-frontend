import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GetExamScheduleOptionsResponse } from '../Models/get-exam-schedule-options-response';
import { Standard } from '../Models/standard';
import { Examtype } from '../Models/examtype';
import { Subject } from '../Models/subject';
import { CreateExamScheduleStandardVM } from '../Models/create-exam-schedule-standard-vm';
import { ExamScheduleService } from '../services/exam-schedule.service';
import { ExamtypeService } from '../services/examtype.service';
import { StandardService } from '../services/standard.service';
import { SubjectService } from '../services/subject.service';
import { ExamScheduleStandardService } from '../services/exam-schedule-standard.service';
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-exam-schedule-standards-create',
  templateUrl: './exam-schedule-standards-create.component.html',
  styleUrl: './exam-schedule-standards-create.component.css',
    imports: [FormsModule]
})
export class ExamScheduleStandardsCreateComponent implements OnInit {

  public examScheduleList: GetExamScheduleOptionsResponse[] = [];
  public standardList: Standard[] = [];
  public subjectList: Subject[] = [];
  public examTypeList: Examtype[] = [];
  public model!: CreateExamScheduleStandardVM;
  constructor(
    private examScheduleService: ExamScheduleService,
    private examTypeService: ExamtypeService,
    private standardService: StandardService,
    private subjectService: SubjectService,
    private examScheduleStandardsService: ExamScheduleStandardService,
    private router: Router) { }

  ngOnInit(): void {
    this.LoadExamSchedules();
    this.LoadStandards();
    this.LoadSubjects();
    this.LoadExamTypes();
    this.model = new CreateExamScheduleStandardVM();
  }

  OnSubmit() {

    alert(JSON.stringify(this.model));

    this.examScheduleStandardsService.SaveExamScheduleStandards(this.model).subscribe({
      next: () => {
        this.router.navigate(['/examScheduleStandard']);
      },
      error: (err) => {
        console.log(err);
      }
    });

  }

  LoadExamSchedules() {
    this.examScheduleService.GetExamScheduleOptions().subscribe((data: GetExamScheduleOptionsResponse[]) => {
      this.examScheduleList = data;
    }, (error) => {
      console.log('Observable emitted an error: ' + error);
    });
  }

  LoadStandards() {
    this.standardService.getStandards().subscribe((data: Standard[]) => {
      this.standardList = data;
    }, (error) => {
      console.log('Observable emitted an error: ' + error);
    });
  }

  LoadSubjects() {
    this.subjectService.getSubjects().subscribe((data: Subject[]) => {
      this.subjectList = data;
    }, (error) => {
      console.log('Observable emitted an error: ' + error);
    });
  }

  LoadExamTypes() {
    this.examTypeService.GetdbsExamType().subscribe((data: Examtype[]) => {
      this.examTypeList = data;
    }, (error) => {
      console.log('Observable emitted an error: ' + error);
    });
  }


  AddExamSubject() {
    this.model.examSubjects.push({
      subjectId: 0,
      examTypeId: 0,
      examDate: new Date(),
      examStartTime: '',
      examEndTime: ''
    })
  }

  DeleteExamSubject(index: number) {
    this.model.examSubjects.splice(index, 1);
  }

}
