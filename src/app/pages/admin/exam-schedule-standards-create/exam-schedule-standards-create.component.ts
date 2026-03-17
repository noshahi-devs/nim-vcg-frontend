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

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  constructor(
    private examScheduleService: ExamScheduleService,
    private examTypeService: ExamtypeService,
    private standardService: StandardService,
    private subjectService: SubjectService,
    private examScheduleStandardsService: ExamScheduleStandardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadExamSchedules();
    this.loadStandards();
    this.loadSubjects();
    this.loadExamTypes();
    this.addExamSubject();
  }

  // ── Helpers ──
  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

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
    this.isProcessing = true;
    this.examScheduleStandardsService.SaveExamScheduleStandards(this.model)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => {
          this.triggerSuccess('Schedule Saved!', 'Exam schedule has been added successfully.');
          setTimeout(() => this.router.navigate(['/exam-schedule-standards-list']), 1800);
        },
        error: err => {
          console.error(err);
          this.triggerError('Error', 'Failed to save exam schedule. Please try again.');
        }
      });
  }
}
