import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamSchedule } from '../services/exam.service';
import { ExamScheduleService } from '../services/exam-schedule.service';

@Component({
  selector: 'app-exam-schedule',
  templateUrl: './exam-schedule.component.html',
  styleUrl: './exam-schedule.component.css',
    imports: [ReactiveFormsModule]
})
export class ExamScheduleComponent implements OnInit {

  public examschedule!: ExamSchedule;
  public form !: FormGroup;
  constructor(private examScheduleService: ExamScheduleService, private router: Router) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      examScheduleId: new FormControl(0),
      examScheduleName: new FormControl('', [Validators.required]),
    })
  }

  get examScheduleName() {
    return this.form.controls["examScheduleName"]
  }
  SaveExamSchedule() {
    this.examScheduleService.SaveExamSchedule(this.form.value).subscribe({
      next: () => { this.router.navigate(['/examSchedule']) }
    })
  }
}