import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// interface StudentMarks extends MarksEntry {
//   isEditing?: boolean;
// }

@Component({
  selector: 'app-marks-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './marks-entry.component.html',
  styleUrl: './marks-entry.component.css'
})
// export class MarksEntryComponent implements OnInit {
//   title = 'Marks Entry';

//   studentMarks: StudentMarks[] = [];
//   loading = false;

//   // Filters
//   selectedExamId: number = 0;
//   selectedClassId: number = 0;
//   selectedSectionId: number = 0;
//   selectedSubjectId: number = 0;

//   // Dropdown data
//   exams: Exam[] = [];
//   classes = [
//     { id: 1, name: 'Class 10' },
//     { id: 2, name: 'Class 9' },
//     { id: 3, name: 'Class 8' }
//   ];

//   sections = [
//     { id: 1, name: 'Section A' },
//     { id: 2, name: 'Section B' },
//     { id: 3, name: 'Section C' }
//   ];

//   subjects = [
//     { id: 1, name: 'Mathematics' },
//     { id: 2, name: 'English' },
//     { id: 3, name: 'Science' },
//     { id: 4, name: 'Urdu' },
//     { id: 5, name: 'Islamiat' },
//     { id: 6, name: 'Physics' },
//     { id: 7, name: 'Chemistry' },
//     { id: 8, name: 'Biology' }
//   ];

//   constructor(private examService: ExamService) {}

//   ngOnInit() {
//     this.loadExams();
//   }

//   loadExams() {
//     this.examService.getAllExams().subscribe({
//       next: (res) => {
//         this.exams = res || [];
//       },
//       error: (err) => {
//         console.error('Error fetching exams:', err);
//         this.exams = [
//           {
//             examId: 1,
//             examName: 'Mid Term Exam 2024',
//             examType: 'Term',
//             classId: 1,
//             sectionId: 1,
//             startDate: '2024-03-15',
//             endDate: '2024-03-25',
//             status: 'Active'
//           }
//         ];
//       }
//     });
//   }

//   loadMarks() {
//     if (!this.selectedExamId || !this.selectedSubjectId) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Selection Required',
//         text: 'Please select Exam and Subject to load marks'
//       });
//       return;
//     }

//     this.loading = true;
//     this.examService
//       .getMarksByExamAndSubject(this.selectedExamId, this.selectedSubjectId)
//       .pipe(finalize(() => (this.loading = false)))
//       .subscribe({
//         next: (res) => {
//           this.studentMarks = res || [];
//           if (this.studentMarks.length === 0) {
//             this.loadMockStudents();
//           }
//         },
//         error: (err) => {
//           console.error('Error fetching marks:', err);
//           this.loadMockStudents();
//         }
//       });
//   }

//   loadMockStudents() {
//     // Mock student data for demonstration
//     this.studentMarks = [
//       {
//         marksId: 1,
//         examId: this.selectedExamId,
//         subjectId: this.selectedSubjectId,
//         studentId: 1,
//         rollNo: '001',
//         studentName: 'Ahmed Ali',
//         totalMarks: 100,
//         obtainedMarks: 0,
//         grade: '',
//         percentage: 0,
//         remarks: '',
//         isPublished: false,
//         isEditing: false
//       },
//       {
//         marksId: 2,
//         examId: this.selectedExamId,
//         subjectId: this.selectedSubjectId,
//         studentId: 2,
//         rollNo: '002',
//         studentName: 'Fatima Noor',
//         totalMarks: 100,
//         obtainedMarks: 0,
//         grade: '',
//         percentage: 0,
//         remarks: '',
//         isPublished: false,
//         isEditing: false
//       },
//       {
//         marksId: 3,
//         examId: this.selectedExamId,
//         subjectId: this.selectedSubjectId,
//         studentId: 3,
//         rollNo: '003',
//         studentName: 'Hassan Khan',
//         totalMarks: 100,
//         obtainedMarks: 0,
//         grade: '',
//         percentage: 0,
//         remarks: '',
//         isPublished: false,
//         isEditing: false
//       },
//       {
//         marksId: 4,
//         examId: this.selectedExamId,
//         subjectId: this.selectedSubjectId,
//         studentId: 4,
//         rollNo: '004',
//         studentName: 'Ayesha Malik',
//         totalMarks: 100,
//         obtainedMarks: 0,
//         grade: '',
//         percentage: 0,
//         remarks: '',
//         isPublished: false,
//         isEditing: false
//       },
//       {
//         marksId: 5,
//         examId: this.selectedExamId,
//         subjectId: this.selectedSubjectId,
//         studentId: 5,
//         rollNo: '005',
//         studentName: 'Usman Tariq',
//         totalMarks: 100,
//         obtainedMarks: 0,
//         grade: '',
//         percentage: 0,
//         remarks: '',
//         isPublished: false,
//         isEditing: false
//       }
//     ];
//   }

//   onFilterChange() {
//     if (this.selectedExamId && this.selectedSubjectId) {
//       this.loadMarks();
//     }
//   }

//   calculateGradeAndPercentage(student: StudentMarks) {
//     if (student.totalMarks > 0) {
//       student.percentage = this.examService.calculatePercentage(
//         student.obtainedMarks,
//         student.totalMarks
//       );
//       student.grade = this.examService.calculateGrade(student.percentage);
//     }
//   }

//   // onObtainedMarksChange(student: StudentMarks) {
//   //   // Validate marks
//   //   if (student.obtainedMarks > student.totalMarks) {
//   //     Swal.fire({
//   //       icon: 'error',
//   //       title: 'Invalid Marks',
//   //       text: 'Obtained marks cannot be greater than total marks',
//   //       timer: 2000,
//   //       showConfirmButton: false
//   //     });
//   //     // student.obtainedMarks = student.totalMarks;
//   //   }

//   //   // if (student.obtainedMarks < 0) {
//   //   //   // student.obtainedMarks = 0;
//   //   // }

//   //   this.calculateGradeAndPercentage(student);
//   // }

//   saveMarks() {
//     if (this.studentMarks.length === 0) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'No Data',
//         text: 'No marks to save'
//       });
//       return;
//     }

//     Swal.fire({
//       title: 'Save Marks?',
//       text: 'Do you want to save all marks?',
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonColor: '#3085d6',
//       cancelButtonColor: '#d33',
//       confirmButtonText: 'Yes, Save'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.loading = true;
//         this.examService
//           .bulkUpdateMarks(this.studentMarks)
//           .pipe(finalize(() => (this.loading = false)))
//           .subscribe({
//             next: (res) => {
//               Swal.fire({
//                 icon: 'success',
//                 title: 'Marks Saved Successfully!',
//                 showConfirmButton: false,
//                 timer: 1500
//               });
//             },
//             error: (err) => {
//               console.error('Save failed:', err);
//               Swal.fire({
//                 icon: 'error',
//                 title: 'Failed to Save Marks',
//                 text: err.error?.message || 'Something went wrong!'
//               });
//             }
//           });
//       }
//     });
//   }

//   publishResults() {
//     if (!this.selectedExamId || !this.selectedSubjectId) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Selection Required',
//         text: 'Please select Exam and Subject'
//       });
//       return;
//     }

//     Swal.fire({
//       title: 'Publish Results?',
//       text: 'Once published, results will be visible to students. Continue?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#3085d6',
//       cancelButtonColor: '#d33',
//       confirmButtonText: 'Yes, Publish'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.loading = true;
//         this.examService
//           .publishResults(this.selectedExamId, this.selectedSubjectId)
//           .pipe(finalize(() => (this.loading = false)))
//           .subscribe({
//             next: (res) => {
//               Swal.fire({
//                 icon: 'success',
//                 title: 'Results Published Successfully!',
//                 showConfirmButton: false,
//                 timer: 1500
//               });
//               this.studentMarks.forEach(s => s.isPublished = true);
//             },
//             error: (err) => {
//               console.error('Publish failed:', err);
//               Swal.fire({
//                 icon: 'error',
//                 title: 'Failed to Publish Results',
//                 text: err.error?.message || 'Something went wrong!'
//               });
//             }
//           });
//       }
//     });
//   }

//   importExcel() {
//     Swal.fire({
//       icon: 'info',
//       title: 'Import Excel',
//       text: 'Excel import functionality will be implemented with file upload'
//     });
//   }

//   exportExcel() {
//     Swal.fire({
//       icon: 'info',
//       title: 'Export Excel',
//       text: 'Excel export functionality will be implemented'
//     });
//   }

//   getGradeBadgeClass(grade: string): string {
//     switch (grade) {
//       case 'A+':
//       case 'A':
//         return 'bg-success-focus text-success-600 border border-success-main';
//       case 'B':
//         return 'bg-info-focus text-info-600 border border-info-main';
//       case 'C':
//         return 'bg-warning-focus text-warning-600 border border-warning-main';
//       case 'D':
//         return 'bg-orange-focus text-orange-600 border border-orange-main';
//       case 'F':
//         return 'bg-danger-focus text-danger-600 border border-danger-main';
//       default:
//         return 'bg-neutral-200 text-neutral-600';
//     }
//   }
// }
export class MarksEntryComponent{

}