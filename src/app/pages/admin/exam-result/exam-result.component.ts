import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, ExamResult, Exam } from '../../../services/exam.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { StudentService } from '../../../services/student.service';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { Student } from '../../../Models/student';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../SecurityModels/auth.service';
import { PopupService } from '../../../services/popup.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { Staff } from '../../../Models/staff';
import { SessionService } from '../../../services/session.service';
import { SettingsService } from '../../../services/settings.service';
import { environment } from '../../../../environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.css'
})
export class ExamResultComponent implements OnInit {
  title = 'Exam Results';

  examResults: ExamResult[] = [];
  displayResults: any[] = [];
  loading = false;
  noResultsFound = false;
  hasSearched = false;
  isProcessing = false;

  // Modals handled by PopupService

  // Filters
  selectedExamId: number = 0;
  selectedStudentId: number = 0;
  selectedClassId: number = 0;
  selectedSectionId: number = 0;
  selectedSubjectId: number = 0;

  // Real data
  exams: Exam[] = [];
  classes: Standard[] = [];
  sections: Section[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];
  subjects: any[] = [];

  // Pagination
  currentPage: number = 1;
  rowsPerPage: number = 10;
  totalPages: number = 1;
  paginatedBulkResults: any[] = [];
  filteredBulkResults: any[] = [];

  // Summary data
  totalMarks: number = 0;
  obtainedMarks: number = 0;
  percentage: number = 0;
  overallGrade = '';
  resultStatus = '';
  currentYear = new Date().getFullYear();

  constructor(
    private examService: ExamService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private studentService: StudentService,
    private authService: AuthService,
    private staffService: StaffService,
    private assignmentService: SubjectAssignmentService,
    private sessionService: SessionService,
    private settingsService: SettingsService,
    private popup: PopupService
  ) { }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadExams();

    const isTeacher = this.authService.hasAnyRole(['Teacher']);
    const currentUser = this.authService.userValue;

    if (isTeacher && currentUser?.email) {
      this.staffService.getStaffByEmail(currentUser.email).subscribe({
        next: (staff: Staff) => {
          this.currentStaffId = staff.staffId;
          this.loadTeacherAssignments(staff.staffId);
        },
        error: () => this.loadClasses()
      });
    } else {
      this.loadClasses();
    }
  }

  currentStaffId: number | null = null;
  assignedSections: SubjectAssignment[] = [];
  assignedClassNames: string[] = [];

  loadTeacherAssignments(staffId: number): void {
    forkJoin({
      allClasses: this.standardService.getStandards(),
      assignments: this.assignmentService.getAssignmentsByTeacher(staffId),
      sections: this.sectionService.getSections()
    }).subscribe({
      next: (result) => {
        // Sections where staff is Class Teacher
        const classTeacherSections = (result.sections || []).filter(s => s.staffId === staffId);

        // Combine with subject assignments
        const allAssignedSections = [
          ...classTeacherSections.map(s => ({ sectionId: s.sectionId, sectionName: s.sectionName, className: s.className })),
          ...(result.assignments || []).map(a => ({
            sectionId: a.sectionId,
            sectionName: a.section?.sectionName,
            className: a.section?.className || a.subject?.standard?.standardName
          }))
        ];

        // Unique classes
        this.assignedClassNames = [...new Set(allAssignedSections.map(s => s.className).filter(name => !!name))];
        this.classes = (result.allClasses || []).filter(c => this.assignedClassNames.includes(c.standardName));

        // Store for section filtering
        this.assignedSections = result.assignments || [];
      },
      error: () => this.loadClasses()
    });
  }

  loadExams() {
    this.examService.getAllExams().subscribe({
      next: (res: any[]) => {
        // Map backend properties (examScheduleId/examScheduleName) to frontend model
        this.exams = (res || []).map(e => ({
          ...e,
          examId: e.examScheduleId || e.id,
          examName: e.examScheduleName || e.name || e.examName
        }));
      },
      error: (err) => {
        console.error('Failed to load exams', err);
      }
    });
  }


  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.classes = res || [];
        if (this.classes.length === 0) {
          this.loadMockClasses();
        }
      },
      error: (err) => {
        console.error('Failed to load classes', err);
        this.loadMockClasses();
      }
    });
  }

  loadMockClasses() {
    this.classes = [
      { standardId: 1, standardName: 'Class 1' },
      { standardId: 2, standardName: 'Class 2' },
      { standardId: 3, standardName: 'Class 3' }
    ] as any;
  }

  onClassChange() {
    this.selectedSectionId = 0;
    this.selectedStudentId = 0;
    this.selectedSubjectId = 0;
    this.sections = [];
    this.students = [];
    this.filteredStudents = [];
    this.subjects = [];
    this.examResults = [];

    if (this.selectedClassId) {
      const selectedClass = this.classes.find(c => c.standardId === this.selectedClassId);

      this.sectionService.getSections().subscribe({
        next: (res) => {
          const allSections = res || [];
          if (this.authService.hasAnyRole(['Teacher'])) {
            this.sections = allSections.filter(s =>
              s.className === selectedClass?.standardName &&
              (s.staffId === this.currentStaffId ||
                this.assignedSections.some(a => a.sectionId === s.sectionId))
            );
          } else {
            this.sections = allSections.filter(s => s.className === selectedClass?.standardName);
          }
          if (this.sections.length === 0 && !res) this.loadMockSections();
        },
        error: (err) => {
          console.error('Failed to load sections', err);
          this.loadMockSections();
        }
      });

      this.loadStudentsByClass();
    }
  }

  loadMockSections() {
    this.sections = [
      { sectionId: 1, sectionName: 'A' },
      { sectionId: 2, sectionName: 'B' }
    ] as any;
  }

  loadStudentsByClass() {
    const yearId = this.sessionService.getCurrentYearId();
    this.studentService.GetStudents(yearId).subscribe({
      next: (res) => {
        const allStudents = res || [];
        if (this.authService.hasAnyRole(['Teacher'])) {
          this.students = allStudents.filter(s => s.standardId === this.selectedClassId);
          // Further filter by assigned sections if section is selected
          this.filterStudents();
        } else {
          this.students = allStudents.filter(s => s.standardId === this.selectedClassId);
          this.filterStudents();
        }
      },
      error: (err) => {
        console.error('Failed to load students', err);
        this.loadMockStudents();
        this.filterStudents();
      }
    });
  }

  loadMockStudents() {
    this.students = [
      { studentId: 1, studentName: 'Ali Khan', standardId: 1, sectionId: 1, admissionNo: '1001' },
      { studentId: 2, studentName: 'Sara Ahmed', standardId: 1, sectionId: 2, admissionNo: '1002' },
      { studentId: 3, studentName: 'Omar Farooq', standardId: 2, sectionId: 1, admissionNo: '1003' },
      { studentId: 4, studentName: 'Zainab Bibi', standardId: 2, sectionId: 2, admissionNo: '1004' }
    ] as any;
  }

  filterStudents() {
    this.filteredStudents = this.students;
    // Apply further filtering based on selectedSectionId if applicable
  }

  onSectionChange() {
    this.selectedStudentId = 0;
    this.selectedSubjectId = 0;
    this.filterStudents();
    this.fetchSubjectsForExam();
  }

  fetchSubjectsForExam() {
    if (!this.selectedExamId) return;
    this.examService.getSchedulesByExam(this.selectedExamId).subscribe({
      next: (res) => {
        const uniqueSubjects = new Map();
        // Backend returns ExamScheduleVM with ExamScheduleStandards -> ExamSubjects
        if (res && res.examScheduleStandards) {
          res.examScheduleStandards.forEach((std: any) => {
            if (std.examSubjects) {
              std.examSubjects.forEach((sub: any) => {
                if (sub.subjectName && !uniqueSubjects.has(sub.subjectName)) {
                  uniqueSubjects.set(sub.subjectName, { 
                    subjectId: uniqueSubjects.size + 1, // Artificial ID for selection
                    subjectName: sub.subjectName 
                  });
                }
              });
            }
          });
        }
        this.subjects = Array.from(uniqueSubjects.values());
      },
      error: (err) => console.error('Failed to load subjects for exam', err)
    });
  }

  loadResults() {
    if (!this.selectedExamId) {
      this.popup.warning('Please select an Exam.', 'Selection Required');
      return;
    }

    this.loading = true;
    this.popup.loading('Loading results...');
    this.hasSearched = true;
    this.noResultsFound = false;
    this.examResults = [];
    this.displayResults = [];
    this.paginatedBulkResults = [];
    this.filteredBulkResults = [];

    if (this.selectedStudentId > 0) {
      // Single Student View
      this.loadSingleStudentResult();
    } else {
      // All Students in Class/Section View
      this.loadAllStudentsResults();
    }
  }

  loadSingleStudentResult() {
    this.examService
      .getResultByStudent(this.selectedStudentId, this.selectedExamId)
      .pipe(finalize(() => { this.loading = false; this.isProcessing = false; }))
      .subscribe({
        next: (res) => {
          if (res && res.subjects && res.subjects.length > 0) {
            this.mapSingleResultToDisplay(res);
            this.examResults = [res];
            this.calculateSummary();
            this.popup.closeLoading();
          } else {
            this.noResultsFound = true;
            this.popup.closeLoading();
          }
        },
        error: () => { this.noResultsFound = true; this.popup.closeLoading(); }
      });
  }

  loadAllStudentsResults() {
    this.examService
      .getResultsByExam(this.selectedExamId, this.selectedClassId, this.selectedSectionId)
      .pipe(finalize(() => { this.loading = false; this.isProcessing = false; }))
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            this.examResults = res;
            this.noResultsFound = false;
            this.updateFilteredBulkResults();
            this.popup.closeLoading();
          } else {
            this.noResultsFound = true;
            this.popup.closeLoading();
          }
        },
        error: () => { this.noResultsFound = true; this.popup.closeLoading(); }
      });
  }

  private mapSingleResultToDisplay(res: any) {
    this.displayResults = (res.subjects || []).map((s: any) => ({
      subjectName: s.subjectName || 'N/A',
      totalMarks: s.totalMarks || 0,
      obtainedMarks: s.obtainedMarks || 0,
      grade: s.grade || '—',
      percentage: this.examService.calculatePercentage(s.obtainedMarks || 0, s.totalMarks || 0),
      isPassed: (s.status || '').toLowerCase() === 'passed' || (s.grade || 'F') !== 'F'
    }));
  }

  updateFilteredBulkResults() {
    if (!this.selectedSubjectId) {
      this.filteredBulkResults = [...this.examResults];
    } else {
      const subjectName = this.subjects.find(s => s.subjectId === this.selectedSubjectId)?.subjectName;
      if (subjectName) {
        this.filteredBulkResults = this.examResults.map(r => {
          const filteredSubjects = (r.subjects || []).filter((s: any) => s.subjectName === subjectName);
          if (filteredSubjects.length > 0) {
            const s = filteredSubjects[0];
            return {
              ...r,
              totalMarks: s.totalMarks,
              obtainedMarks: s.obtainedMarks,
              percentage: this.examService.calculatePercentage(s.obtainedMarks, s.totalMarks),
              grade: s.grade
            };
          }
          return { ...r, totalMarks: 0, obtainedMarks: 0, percentage: 0, grade: '—' };
        }).filter(r => r.totalMarks > 0);
      } else {
        this.filteredBulkResults = [...this.examResults];
      }
    }
    this.totalPages = Math.ceil(this.filteredBulkResults.length / this.rowsPerPage) || 1;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedBulkResults = this.filteredBulkResults.slice(startIndex, startIndex + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }


  getSelectedSubjectName(): string {
    return this.subjects.find(s => s.subjectId === this.selectedSubjectId)?.subjectName || 'N/A';
  }

  calculateSummary() {
    this.totalMarks = this.displayResults.reduce((sum, r) => sum + (r.totalMarks || 0), 0);
    this.obtainedMarks = this.displayResults.reduce((sum, r) => sum + (r.obtainedMarks || 0), 0);
    this.percentage = this.totalMarks > 0 ? (this.obtainedMarks / this.totalMarks) * 100 : 0;
    // Always compute grade and status from percentage (do not trust backend isPassed)
    this.overallGrade = this.getComputedGrade(this.percentage);
    this.resultStatus = this.percentage >= 50 ? 'PASS' : 'FAIL';
  }

  // ──────────────────────────────────────────────
  //  Print & PDF
  // ──────────────────────────────────────────────
  schoolName = 'Vision College';
  schoolAddress = '';

  private ensureSchoolInfo(): Promise<void> {
    return new Promise(resolve => {
      this.settingsService.getSchoolInfo().subscribe(info => {
        this.schoolName = info['schoolName'] || info['SchoolName'] || 'Vision College';
        this.schoolAddress = info['schoolAddress'] || info['SchoolAddress'] || '';
        resolve();
      }, () => resolve());
    });
  }

  async printResult() {
    await this.ensureSchoolInfo();
    const isSingleStudent = this.selectedStudentId > 0;
    const student = this.filteredStudents.find(s => s.studentId === this.selectedStudentId);
    const exam = this.exams.find(e => e.examId === this.selectedExamId);
    const cls = this.classes.find(c => c.standardId === this.selectedClassId);
    const section = this.sections.find(s => s.sectionId === this.selectedSectionId);
    const logoSrc = window.location.origin + '/assets/img/vision_logo.png';
    const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });

    let bodyContent = '';

    if (isSingleStudent) {
      // ── Single Student Card ──
      const statusColor = this.resultStatus === 'PASS' ? '#15803d' : '#dc2626';
      const statusBg = this.resultStatus === 'PASS' ? '#dcfce7' : '#fee2e2';
      const studentImg = this.getStudentImageUrl(student || null);

      const rows = this.displayResults.map((r, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:10px 16px; border-bottom:1px solid #e2e8f0;">${r.subjectName}</td>
          <td style="padding:10px 16px; border-bottom:1px solid #e2e8f0; text-align:center;">${r.totalMarks}</td>
          <td style="padding:10px 16px; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:700;">${r.obtainedMarks}</td>
          <td style="padding:10px 16px; border-bottom:1px solid #e2e8f0; text-align:center;">${(r.percentage || 0).toFixed(1)}%</td>
          <td style="padding:10px 16px; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:700; color:#1e40af;">${r.grade}</td>
          <td style="padding:10px 16px; border-bottom:1px solid #e2e8f0; text-align:center;">
            <span style="display:inline-flex; align-items:center; gap:5px; padding:5px 14px; border-radius:30px; font-size:12px; font-weight:700; background:${r.isPassed ? '#dcfce7' : '#fee2e2'}; color:${r.isPassed ? '#15803d' : '#dc2626'}; border:1.5px solid ${r.isPassed ? '#86efac' : '#fca5a5'};"><svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3'><polyline points='${r.isPassed ? '20 6 9 17 4 12' : '18 6 6 18'}'></polyline>${r.isPassed ? '' : "<line x1='6' y1='6' x2='18' y2='18'></line>"}</svg> ${r.isPassed ? 'Passed' : 'Failed'}</span>
          </td>
        </tr>`).join('');

      bodyContent = `
        <!-- Student Info Panel -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
          <tr>
            <td style="vertical-align:top; border-right:1px solid #e2e8f0;">
              <table style="width:100%; border-collapse:collapse;">
                <tr style="background:#f1f5f9;">
                  <td style="padding:9px 16px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase; width:130px;">Student Name</td>
                  <td style="padding:9px 16px; font-size:13px; font-weight:700; color:#1e293b;">${student?.studentName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:9px 16px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Admission No</td>
                  <td style="padding:9px 16px; font-size:13px; font-weight:600; color:#1e293b;">${student?.admissionNo || 'N/A'}</td>
                </tr>
                <tr style="background:#f1f5f9;">
                  <td style="padding:9px 16px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Class / Section</td>
                  <td style="padding:9px 16px; font-size:13px; color:#1e293b;">${cls?.standardName || 'N/A'} / ${section?.sectionName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:9px 16px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Exam</td>
                  <td style="padding:9px 16px; font-size:13px; color:#1e293b;">${exam?.examName || 'N/A'}</td>
                </tr>
              </table>
            </td>
            <td style="width:110px; padding:12px; text-align:center; vertical-align:middle; background:#fff;">
              <img src="${studentImg}" style="width:85px; height:85px; object-fit:cover; border-radius:10px; border:2px solid #e2e8f0; background:#f8fafc;" onerror="this.src='assets/images/user-grid/user-grid-img2.png'" />
              <div style="font-size:9px; color:#94a3b8; margin-top:4px; font-weight:600; text-transform:uppercase;">Student Photo</div>
            </td>
          </tr>
        </table>

        <!-- Results Table -->
        <table style="width:100%; border-collapse:collapse; font-size:13px; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; margin-bottom:20px;">
          <thead>
            <tr style="background:var(--primary-color);">
              <th style="padding:11px 16px; text-align:left; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Subject</th>
              <th style="padding:11px 16px; text-align:center; color:#fff; font-size:11px; text-transform:uppercase;">Total Marks</th>
              <th style="padding:11px 16px; text-align:center; color:#fff; font-size:11px; text-transform:uppercase;">Obtained</th>
              <th style="padding:11px 16px; text-align:center; color:#fff; font-size:11px; text-transform:uppercase;">Percentage</th>
              <th style="padding:11px 16px; text-align:center; color:#fff; font-size:11px; text-transform:uppercase;">Grade</th>
              <th style="padding:11px 16px; text-align:center; color:#fff; font-size:11px; text-transform:uppercase;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f8fafc; border-top:2px solid var(--primary-color);">
              <td style="padding:11px 16px; font-weight:800; font-size:13px;">Grand Total</td>
              <td style="padding:11px 16px; text-align:center; font-weight:800;">${this.totalMarks}</td>
              <td style="padding:11px 16px; text-align:center; font-weight:800; color:var(--primary-color);">${this.obtainedMarks}</td>
              <td style="padding:11px 16px; text-align:center; font-weight:800;">${this.percentage.toFixed(1)}%</td>
              <td style="padding:11px 16px; text-align:center; font-weight:800; color:#1e40af;">${this.overallGrade}</td>
              <td style="padding:11px 16px; text-align:center;">
                <span style="padding:4px 16px; border-radius:20px; font-size:13px; font-weight:800; background:${statusBg}; color:${statusColor};">${this.resultStatus}</span>
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Result Stamp -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:28px;">
          <div style="text-align:center; padding:12px 28px; border-radius:12px; border:3px solid ${statusColor}; background:${statusBg};">
            <div style="font-size:28px; font-weight:900; color:${statusColor}; letter-spacing:3px;">${this.resultStatus}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">Overall Result</div>
          </div>
        </div>`;

    } else {
      // ── Class Performance Report ──
      const rows = this.filteredBulkResults.map((r, i) => {
        const isPassed = (r.percentage || 0) >= 50;
        return `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0; text-align:center; color:#64748b;">${i + 1}</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0; font-weight:700;">${r.studentName}</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0;">${r.className || ''}</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0;">${r.sectionName || ''}</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0; text-align:center;">${r.totalMarks}</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:700; color:var(--primary-color);">${r.obtainedMarks}</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0; text-align:center;">${(r.percentage || 0).toFixed(1)}%</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:700; color:#1e40af;">${r.grade || '-'}</td>
          <td style="padding:9px 14px; border-bottom:1px solid #e2e8f0; text-align:center;">
            <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:30px; font-size:11px; font-weight:700; background:${isPassed ? '#dcfce7' : '#fee2e2'}; color:${isPassed ? '#15803d' : '#dc2626'}; border:1.5px solid ${isPassed ? '#86efac' : '#fca5a5'};"><svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3'><polyline points='${isPassed ? '20 6 9 17 4 12' : '18 6 6 18'}'></polyline>${isPassed ? '' : "<line x1='6' y1='6' x2='18' y2='18'></line>"}</svg> ${isPassed ? 'Passed' : 'Failed'}</span>
          </td>
        </tr>`; }).join('');

      bodyContent = `
        <!-- Summary Info -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
          <tr>
            <td style="padding:10px 16px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Exam</td>
            <td style="padding:10px 16px; font-size:13px; font-weight:700; color:#1e293b;">${exam?.examName || 'N/A'}</td>
            <td style="padding:10px 16px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Class</td>
            <td style="padding:10px 16px; font-size:13px; color:#1e293b;">${cls?.standardName || 'All Classes'}</td>
            <td style="padding:10px 16px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Total Students</td>
            <td style="padding:10px 16px; font-size:13px; font-weight:700; color:var(--primary-color);">${this.filteredBulkResults.length}</td>
          </tr>
        </table>

        <!-- Class Table -->
        <table style="width:100%; border-collapse:collapse; font-size:12.5px; border:1px solid #e2e8f0; overflow:hidden;">
          <thead>
            <tr style="background:var(--primary-color);">
              <th style="padding:10px 14px; text-align:center; color:#fff; font-size:10px; text-transform:uppercase;">#</th>
              <th style="padding:10px 14px; text-align:left; color:#fff; font-size:10px; text-transform:uppercase;">Student Name</th>
              <th style="padding:10px 14px; text-align:left; color:#fff; font-size:10px; text-transform:uppercase;">Class</th>
              <th style="padding:10px 14px; text-align:left; color:#fff; font-size:10px; text-transform:uppercase;">Section</th>
              <th style="padding:10px 14px; text-align:center; color:#fff; font-size:10px; text-transform:uppercase;">Total</th>
              <th style="padding:10px 14px; text-align:center; color:#fff; font-size:10px; text-transform:uppercase;">Obtained</th>
              <th style="padding:10px 14px; text-align:center; color:#fff; font-size:10px; text-transform:uppercase;">%</th>
              <th style="padding:10px 14px; text-align:center; color:#fff; font-size:10px; text-transform:uppercase;">Grade</th>
              <th style="padding:10px 14px; text-align:center; color:#fff; font-size:10px; text-transform:uppercase;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    const html = `<!DOCTYPE html><html><head><title>Result Card</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
        .page { padding: 28px 32px; max-width: 900px; margin: 0 auto; }

        /* Letterhead */
        .letterhead { display: flex; align-items: center; gap: 20px; padding-bottom: 16px; border-bottom: 3px solid var(--primary-color); margin-bottom: 6px; }
        .logo { width: 72px; height: 72px; object-fit: contain; }
        .school-info { flex: 1; }
        .school-name { font-size: 24px; font-weight: 900; color: var(--primary-color); letter-spacing: -0.5px; }
        .school-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
        .print-date { font-size: 11px; color: #94a3b8; text-align: right; }

        /* Title bar */
        .title-bar { background: var(--primary-color); color: #fff; text-align: center; padding: 8px 0;
          font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 18px; }

        /* Signatures */
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; }
        .sig-block { text-align: center; width: 140px; }
        .sig-line { border-top: 1.5px solid #334155; margin-bottom: 5px; padding-top: 4px; }
        .sig-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }

        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 16px; } }
      </style></head>
      <body><div class="page">
        <!-- Letterhead -->
        <div class="letterhead">
          <img class="logo" src="${logoSrc}" onerror="this.style.display='none'" alt="Logo" />
          <div class="school-info">
            <div class="school-name">${this.schoolName}</div>
            ${this.schoolAddress ? `<div class="school-sub">${this.schoolAddress}</div>` : ''}
          </div>
          <div class="print-date">Printed: ${today}</div>
        </div>
        <div class="title-bar">${isSingleStudent ? 'Student Result Card' : 'Class Performance Report'}</div>

        ${bodyContent}

        <!-- Signatures -->
        <div class="signatures">
          <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Class Teacher</div></div>
          <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Exam Controller</div></div>
          <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Principal</div></div>
        </div>
      </div></body></html>`;

    const win = window.open('', '_blank', 'width=960,height=800');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 600);
    }
  }

  async downloadPDF() {
    await this.ensureSchoolInfo();
    const isSingleStudent = this.selectedStudentId > 0;
    const student = this.filteredStudents.find(s => s.studentId === this.selectedStudentId);
    const exam = this.exams.find(e => e.examId === this.selectedExamId);
    const cls = this.classes.find(c => c.standardId === this.selectedClassId);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header ──
    doc.setFillColor(128, 0, 0);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.schoolName, pageW / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(exam?.examName || '', pageW / 2, 20, { align: 'center' });
    doc.text(`Printed: ${new Date().toLocaleDateString('en-PK')}`, pageW - 14, 26, { align: 'right' });

    // ── Sub-header ──
    doc.setTextColor(30, 41, 59);
    const subTitle = isSingleStudent
      ? `Student Report: ${student?.studentName || ''}`
      : `Class Performance Report: ${cls?.standardName || 'All Classes'}`;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(subTitle, 14, 38);

    // ── Summary bar (single student) ──
    if (isSingleStudent) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Total: ${this.totalMarks}  |  Obtained: ${this.obtainedMarks}  |  Percentage: ${this.percentage.toFixed(1)}%  |  Grade: ${this.overallGrade}  |  Status: ${this.resultStatus}`, 14, 46);
    }

    const startY = isSingleStudent ? 52 : 44;

    if (isSingleStudent) {
      autoTable(doc, {
        startY,
        head: [['Subject', 'Total Marks', 'Obtained', 'Percentage', 'Grade', 'Status']],
        body: this.displayResults.map(r => [
          r.subjectName, r.totalMarks, r.obtainedMarks,
          `${(r.percentage || 0).toFixed(1)}%`, r.grade,
          { content: r.isPassed ? 'PASS' : 'FAIL', styles: { textColor: r.isPassed ? [22, 163, 74] : [220, 38, 38] } }
        ]),
        foot: [['Total', this.totalMarks, this.obtainedMarks, `${this.percentage.toFixed(1)}%`, this.overallGrade,
          { content: this.resultStatus, styles: { textColor: this.resultStatus === 'PASS' ? [22, 163, 74] : [220, 38, 38] } }]],
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 14, right: 14 }
      });
      const fileName = `Result_${(student?.studentName || 'Student').replace(/ /g, '_')}_${exam?.examName || 'Exam'}.pdf`;
      doc.save(fileName);
    } else {
      autoTable(doc, {
        startY,
        head: [['#', 'Student Name', 'Class', 'Section', 'Total', 'Obtained', '%', 'Grade', 'Status']],
        body: this.filteredBulkResults.map((r, i) => [
          i + 1, r.studentName, r.className || '', r.sectionName || '',
          r.totalMarks, r.obtainedMarks, `${(r.percentage || 0).toFixed(1)}%`,
          r.grade || '-',
          { content: r.status || '-', styles: { textColor: r.status === 'Pass' ? [22, 163, 74] : [220, 38, 38] } }
        ]),
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });
      const fileName = `ClassReport_${(cls?.standardName || 'Class').replace(/ /g, '_')}_${exam?.examName || 'Exam'}.pdf`;
      doc.save(fileName);
    }
  }

  getGradeBadgeClass(grade: string): string {
    switch (grade) {
      case 'A+': case 'A': return 'bg-success-focus text-success-600 border border-success-main';
      case 'B': return 'bg-info-focus text-info-600 border border-info-main';
      case 'C': return 'bg-warning-focus text-warning-600 border border-warning-main';
      case 'D': return 'bg-orange-focus text-orange-600 border border-orange-main';
      case 'F': return 'bg-danger-focus text-danger-600 border border-danger-main';
      default: return 'bg-neutral-200 text-neutral-600';
    }
  }

  // ── Computed Grade (frontend override to fix backend inaccuracies) ──
  getComputedGrade(percentage: number | null | undefined): string {
    const pct = percentage || 0;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  }

  getGradeStyle(grade: string): { [key: string]: string } {
    const styles: { [key: string]: { [key: string]: string } } = {
      'A+': { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' },
      'A':  { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' },
      'B':  { background: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' },
      'C':  { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' },
      'D':  { background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' },
      'F':  { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' },
    };
    return styles[grade] || { background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: '8px', fontWeight: '600' };
  }

  getResultStatusClass(): string {
    return this.resultStatus === 'PASS'
      ? 'bg-success-focus text-success-600 border border-success-main'
      : 'bg-danger-focus text-danger-600 border border-danger-main';
  }

  formatStandardName(name: string): string {
    if (!name) return '';
    const numberMap: { [key: string]: string } = {
      'One': '1', 'Two': '2', 'Three': '3', 'Four': '4', 'Five': '5',
      'Six': '6', 'Seven': '7', 'Eight': '8', 'Nine': '9', 'Ten': '10'
    };
    let formatted = name;
    Object.keys(numberMap).forEach(word => {
      if (formatted.includes(word)) {
        formatted = formatted.replace(word, numberMap[word]);
      }
    });
    return formatted;
  }

  getStudentImageUrl(student: Student | null): string {
    if (!student) return 'assets/images/user-grid/user-grid-img2.png';
    if (student.imageUpload?.imageData) return student.imageUpload.imageData;
    if (student.imagePath) {
      if (student.imagePath.startsWith('http') || student.imagePath.startsWith('data:')) {
        return student.imagePath;
      }
      return `${environment.apiBaseUrl}/${student.imagePath}`;
    }
    return 'assets/images/user-grid/user-grid-img2.png';
  }
}


