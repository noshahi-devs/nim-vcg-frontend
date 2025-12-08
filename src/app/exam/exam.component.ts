import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ExamtypeService } from '../services/examtype.service';
import { Examtype } from '../Models/examtype';
import { CommonModule, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-exam',
  standalone: true,
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css'],
  imports: [ReactiveFormsModule, FormsModule, CommonModule, NgIf, NgFor]
})
export class ExamComponent implements OnInit {

  public form!: FormGroup;
  examTypes: Examtype[] = [];

  showPopup = false;

  constructor(private examTypeService: ExamtypeService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      examTypeId: new FormControl(0),
      examTypeName: new FormControl('', Validators.required)
    });

    this.loadExamTypes();
  }

  // 🔥 Getter for validation
  get examTypeNameField() {
    return this.form.get('examTypeName');
  }

  // 🔥 Load all exam types
  loadExamTypes() {
    this.examTypeService.GetdbsExamType().subscribe({
      next: (res) => {
        this.examTypes = res;
      }
    });
  }

  // Open popup
  openPopup() {
    this.showPopup = true;
    this.form.reset({ examTypeId: 0 });
  }

  // Close popup
  closePopup() {
    this.showPopup = false;
  }

  // Save exam type
  SaveExamType() {
    if (this.form.invalid) return;

    this.examTypeService.SaveExamType(this.form.value).subscribe({
      next: () => {
        this.closePopup();
        this.loadExamTypes();
      }
    });
  }
}
