import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GetExamScheduleOptionsResponse } from '../../../Models/get-exam-schedule-options-response';
import { Standard } from '../../../Models/standard';
import { Subject } from '../../../Models/subject';
import { Examtype } from '../../../Models/examtype';
import { CreateExamScheduleStandardVM } from '../../../Models/create-exam-schedule-standard-vm';
import { ExamScheduleService } from '../../../services/exam-schedule.service';
import { ExamtypeService } from '../../../services/examtype.service';
import { StandardService } from '../../../services/standard.service';
import { SubjectService } from '../../../services/subject.service';
import { ExamScheduleStandardService } from '../../../services/exam-schedule-standard.service';
import { BreadcrumbComponent } from "../../ui-elements/breadcrumb/breadcrumb.component";
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-exam-schedule-standards-create',
  standalone: true,
  templateUrl: './exam-schedule-standards-create.component.html',
  styleUrls: ['./exam-schedule-standards-create.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [BreadcrumbComponent, CommonModule, FormsModule]
})
export class ExamScheduleStandardsCreateComponent implements OnInit {
  title = "Create Exam Schedule Standard";

  examScheduleList: GetExamScheduleOptionsResponse[] = [];
  standardList: Standard[] = [];
  subjectList: Subject[] = [];
  examTypeList: Examtype[] = [];
  model: CreateExamScheduleStandardVM = new CreateExamScheduleStandardVM();

  isProcessing = false;

  constructor(
    private examScheduleService: ExamScheduleService,
    private examTypeService: ExamtypeService,
    private standardService: StandardService,
    private subjectService: SubjectService,
    private examScheduleStandardsService: ExamScheduleStandardService,
    private router: Router,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadExamSchedules();
    this.loadStandards();
    this.loadSubjects();
    this.loadExamTypes();
    this.addExamSubject();
  }

  // Modals handled by PopupService

  loadExamSchedules() {
    this.examScheduleService.GetExamScheduleOptions().subscribe({
      next: (data) => {
        this.examScheduleList = data || [];
        if (this.examScheduleList.length === 0) this.loadMockExamSchedules();
      },
      error: (err) => { console.error('Error loading exam schedules', err); this.loadMockExamSchedules(); }
    });
  }

  loadMockExamSchedules() {
    this.examScheduleList = [
      { examScheduleId: 1, examScheduleName: 'First Term Exam 2024' },
      { examScheduleId: 2, examScheduleName: 'Monthly Test April' },
      { examScheduleId: 3, examScheduleName: 'Mid Term Exam 2024' }
    ] as GetExamScheduleOptionsResponse[];
  }

  loadStandards() { this.standardService.getStandards().subscribe(data => this.standardList = data); }
  loadSubjects() { this.subjectService.getSubjects().subscribe(data => this.subjectList = data); }
  loadExamTypes() { this.examTypeService.GetdbsExamType().subscribe(data => this.examTypeList = data); }

  addExamSubject() {
    this.model.examSubjects.push({ subjectId: 0, examTypeId: 0, examDate: new Date(), examStartTime: '', examEndTime: '' });
  }

  deleteExamSubject(index: number) { this.model.examSubjects.splice(index, 1); }
  
  getFilteredSubjects(): any[] {
    if (!this.model.standardId) return this.subjectList;
    return this.subjectList.filter(s => s.standardId == this.model.standardId);
  }

  onSubmit() {
    this.popup.loading('Saving exam schedule...');
    this.examScheduleStandardsService.SaveExamScheduleStandards(this.model)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => {
          this.popup.success('Schedule Saved!', 'Exam schedule has been added successfully.');
          setTimeout(() => this.router.navigate(['/exam-schedule-standards-list']), 1800);
        },
        error: err => {
          console.error('Full error object:', err);
          let errorMsg = 'Failed to save exam schedule. Please try again.';
          if (err.error && typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.message) {
            errorMsg = err.message;
          }
          this.popup.error('Save Failed', errorMsg);
        }
      });
  }
}
