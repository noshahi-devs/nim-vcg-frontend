import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../services/student.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { SessionService } from '../../../services/session.service';
import { AcademicYear } from '../../../Models/academic-year';
import { environment } from '../../../../environments/environment';
import { PopupService } from '../../../services/popup.service';
import * as XLSX from 'xlsx';

declare var bootstrap: any;

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit, AfterViewInit, OnDestroy {

  title = 'Students';
  studentList: Student[] = [];
  filteredList: Student[] = [];
  searchTerm: string = '';
  filterClass: string = '';
  filterSection: string = '';
  filterStatus: string = '';
  defaultImage = 'assets/images/user-grid/user-grid-img2.png';
  studentToDelete: Student | null = null;
  classList: Standard[] = [];
  sectionList: Section[] = [];
  isTeacher = false;
  staffId: number | null = null;
  assignedSections: Section[] = [];
  assignedClassNames: string[] = [];
  loading = false;
  Math = Math;
  currentPage = 1;
  rowsPerPage = 12;
  isProcessing = false;
  academicYears: AcademicYear[] = [];
  selectedYearId: number | null = null;
  private sessionSubscription?: Subscription;
  private yearsSubscription?: Subscription;
  stats = { totalStudents: 0, activeStudents: 0, inactiveStudents: 0 };

  get totalStudents(): number { return this.studentList.length > 0 ? this.studentList.length : this.stats.totalStudents; }
  get activeStudents(): number { 
    if (this.studentList.length > 0) {
      return this.studentList.filter(s => s.status?.toLowerCase() === 'active').length; 
    }
    return this.stats.activeStudents;
  }
  get inactiveStudents(): number { 
    if (this.studentList.length > 0) {
      return this.studentList.filter(s => s.status?.toLowerCase() === 'inactive').length; 
    }
    return this.stats.inactiveStudents;
  }
  get yearDisplayName(): string {
    if (!this.selectedYearId) return 'Registry';
    const year = this.academicYears.find(y => y.academicYearId === Number(this.selectedYearId));
    return year ? year.name : 'Unknown Year';
  }
  get visibleSections(): Section[] {
    if (!this.filterClass) return this.sectionList;
    const selectedClass = this.classList.find(c => String(c.standardId) === this.filterClass);
    if (!selectedClass) return this.sectionList;
    return this.sectionList.filter(s => s.className === selectedClass.standardName);
  }

  constructor(
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    public authService: AuthService,
    private staffService: StaffService,
    private assignmentService: SubjectAssignmentService,
    private sessionService: SessionService,
    private popup: PopupService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Set year FIRST so initial load uses the correct academic year
    this.selectedYearId = this.sessionService.getCurrentYearId();

    // Populate year dropdown only — do NOT trigger data reload from here
    this.yearsSubscription = this.sessionService.allYears$.subscribe(years => {
      this.academicYears = years;
      if (!this.selectedYearId && this.academicYears.length > 0) {
        const currentYear = new Date().getFullYear().toString();
        const found = this.academicYears.find(y => y.name.includes(currentYear)) ||
          [...this.academicYears].sort((a, b) => b.academicYearId - a.academicYearId)[0];
        if (found) {
          this.selectedYearId = found.academicYearId;
        }
      }
    });

    // Initial data load (runs once, with year already set above)
    this.checkAuthorization();
    this.loadStats();

    // Only reload when user actively changes academic year (year value must truly change)
    this.sessionSubscription = this.sessionService.currentYear$.subscribe(year => {
      if (year && year.academicYearId !== this.selectedYearId) {
        this.selectedYearId = year.academicYearId;
        this.checkAuthorization();
      }
    });
  }

  private checkAuthorization() {
    this.loading = true;
    const roles: string[] = this.authService.roles || [];
    this.isTeacher = roles.some(r => r.toLowerCase() === 'teacher');
    const currentUser = this.authService.userValue;
    if (this.isTeacher && currentUser?.email) {
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) {
            this.staffId = staff.staffId;
            this.loadTeacherAssignments();
          } else {
            this.loadAllData();
          }
        },
        error: () => this.loadAllData()
      });
    } else {
      this.loadAllData();
    }
  }

  private loadTeacherAssignments() {
    if (!this.staffId) { this.loadAllData(); return; }
    forkJoin({
      sections: this.sectionService.getSections(),
      assignments: this.assignmentService.getAssignmentsByTeacher(this.staffId)
    }).subscribe({
      next: (res) => {
        const classTeacherSections = res.sections.filter(s => s.staffId === this.staffId);
        const assignedSectionIds = res.assignments.map(a => a.sectionId);
        const subjectSections = res.sections.filter(s => assignedSectionIds.includes(s.sectionId));
        const uniqueSections = new Map<number, Section>();
        classTeacherSections.forEach(s => uniqueSections.set(s.sectionId, s));
        subjectSections.forEach(s => uniqueSections.set(s.sectionId, s));
        this.assignedSections = Array.from(uniqueSections.values());
        this.assignedClassNames = [...new Set(this.assignedSections.map(s => s.className))];
        this.loadAllData();
      },
      error: () => this.loadAllData()
    });
  }

  private loadAllData() {
    this.loadStats();
    forkJoin({
      students: this.studentService.GetStudents(this.selectedYearId),
      classes: this.standardService.getStandards(),
      sections: this.sectionService.getSections()
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        this.studentList = res.students;
        this.classList = res.classes;
        this.sectionList = res.sections;
        if (this.isTeacher) this.applyTeacherFiltering();
        this.applyFilters();
      }
    });
  }

  private applyTeacherFiltering() {
    const uniqueSecs = new Map<string, Section>();
    this.assignedSections.forEach(s => uniqueSecs.set(s.sectionName, s));
    this.sectionList = Array.from(uniqueSecs.values());
    this.classList = this.classList.filter(c => this.assignedClassNames.includes(c.standardName));
    this.studentList = this.studentList.filter(s =>
      this.assignedSections.some(sec =>
        (sec.className === this.getClassName(s.standardId)) &&
        (sec.sectionCode === s.section || sec.sectionName === s.section ||
          ((!s.section || s.section.trim() === '') && sec.sectionCode === 'A'))
      )
    );
  }

  onYearChange() { this.loading = true; this.loadAllData(); }
  onClassChange() { this.filterSection = ''; this.applyFilters(); }

  applyFilters() {
    let list = [...this.studentList];
    if (this.filterClass) {
      const classId = Number(this.filterClass);
      list = list.filter(s => Number(s.standardId) === classId);
    }
    if (this.filterSection) {
      const sectionId = Number(this.filterSection);
      list = list.filter(s => Number(s.sectionId) === sectionId || (this.sectionList.find(sec => sec.sectionId === sectionId)?.sectionName === s.section));
    }
    if (this.filterStatus) {
      list = list.filter(s => s.status?.toLowerCase() === this.filterStatus.toLowerCase());
    }
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s => s.studentName.toLowerCase().includes(search) || s.admissionNo?.toString().includes(search) || s.enrollmentNo?.toString().includes(search));
    }
    this.filteredList = list;
    this.currentPage = 1;
  }

  get paginatedStudentList(): Student[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredList.slice(start, start + this.rowsPerPage);
  }
  get totalPages(): number { return Math.ceil(this.filteredList.length / this.rowsPerPage); }
  changePage(page: number): void { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }

  confirmDelete(student: Student) {
    this.popup.confirm(
      'Confirm Deletion',
      `Are you sure you want to delete <strong>${student.studentName}</strong>? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel'
    ).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting student...');
        this.studentService.DeleteStudent(student.studentId).subscribe({
          next: () => {
            this.popup.closeLoading();
            this.studentList = this.studentList.filter(s => s.studentId !== student.studentId);
            this.applyFilters();
            this.popup.deleted('Student');
          },
          error: (err) => {
            this.popup.closeLoading();
            let errorMsg = 'Unable to delete student. They might have active academic, attendance, or financial records.';
            if (err.error && typeof err.error === 'string') errorMsg = err.error;
            else if (err.error?.message) errorMsg = err.error.message;
            this.popup.deleteError('Student', errorMsg);
          }
        });
      }
    });
  }

  getStudentImage(student: any): string {
    if (student.imageUpload && student.imageUpload.imageData) return student.imageUpload.imageData;
    if (student.imagePath) {
      if (student.imagePath.startsWith('http') || student.imagePath.startsWith('data:') || student.imagePath.startsWith('assets/')) return student.imagePath;
      const normalizedPath = student.imagePath.replace(/\\/g, '/').replace(/^\//, '');
      const base = environment.apiBaseUrl || '/api';
      return `${base}/${normalizedPath}`;
    }
    return 'assets/images/user-grid/user-grid-img2.png';
  }

  getClassName(id: number | null): string {
    if (!id) return 'N/A';
    const standard = this.classList.find(c => c.standardId === id);
    return standard ? standard.standardName : `Class ${id}`;
  }

  getStudentDisplay(student: Student): string {
    let className = this.getClassName(student.standardId);
    const numberMap: { [key: string]: string } = { 'One': '1', 'Two': '2', 'Three': '3', 'Four': '4', 'Five': '5', 'Six': '6', 'Seven': '7', 'Eight': '8', 'Nine': '9', 'Ten': '10' };
    Object.keys(numberMap).forEach(word => { if (className.includes(word)) className = className.replace(word, numberMap[word]); });
    let section = student.section;
    if (this.isTeacher && (!section || section.trim() === '')) {
      const assigned = this.assignedSections.find(sec => sec.className === this.getClassName(student.standardId));
      if (assigned) section = assigned.sectionCode || 'A';
    }
    return section ? `${className} Section ${section}` : className;
  }

  ngAfterViewInit(): void { }
  loadStats(): void { this.studentService.getStudentStats(this.selectedYearId).subscribe({ next: (res) => this.stats = res }); }

  ngOnDestroy(): void {
    if (this.sessionSubscription) this.sessionSubscription.unsubscribe();
    if (this.yearsSubscription) this.yearsSubscription.unsubscribe();
  }

  // BULK IMPORT
  downloadTemplate() {
    const headers = [
      ['Student Bulk Enrollment Template'],
      ['Student Name', 'Date of Birth (DD-MM-YYYY)', 'Gender (Male/Female)', 'Class Name', 'Section Name', 'Father Name', 'Father Contact', 'Guardian Phone', 'Admission Date (DD-MM-YYYY)', 'Permanent Address', 'Religion', 'Blood Group', 'Nationality', 'NID Number', 'Previous School', 'Discount Amount'],
      ['Ali Khan', '15-05-2010', 'Male', 'Class One', 'A', 'Ahmad Khan', '03001234567', '03007654321', '03-05-2026', 'House 123, Street 4, Gojra', 'Islam', 'B+', 'Pakistani', '33102-1234567-1', 'Gojra Public School', '500']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Student Data');
    const instHeaders = [
      ['Column Name', 'Instructions / Reference Data'],
      ['Student Name', 'Full name of the student.'],
      ['Date of Birth', 'Format: DD-MM-YYYY or Date format in Excel.'],
      ['Gender', 'Options: Male, Female, Other'],
      ['Class Name', 'Must match exactly: ' + this.classList.map(c => c.standardName).join(', ')],
      ['Section Name', 'e.g., A, B, C, Pink, Blue'],
      ['Admission Date', 'Format: DD-MM-YYYY'],
      ['Discount Amount', 'Monthly fee discount (number only).']
    ];
    const instWs = XLSX.utils.aoa_to_sheet(instHeaders);
    XLSX.utils.book_append_sheet(wb, instWs, 'Instructions');
    XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
  }

  triggerImport() { document.getElementById('excelImport')?.click(); }
  onImportExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.isProcessing = true;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      this.processImportedData(data);
      event.target.value = '';
    };
    reader.readAsBinaryString(file);
  }

  private processImportedData(data: any[]) {
    const rows = data.slice(2);
    const students: any[] = [];
    for (const row of rows) {
      if (!row[0]) continue;
      const parseDate = (dateStr: any, isRequired = false) => {
        let date: Date;
        if (!dateStr) date = new Date();
        else if (typeof dateStr === 'number') date = new Date((dateStr - 25569) * 86400 * 1000);
        else {
          const parts = dateStr.toString().split('-');
          if (parts.length === 3) date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          else date = new Date(dateStr);
        }
        if (isNaN(date.getTime())) return isRequired ? new Date().toISOString() : null;
        return date.toISOString();
      };
      const className = row[3]?.toString().trim();
      const standard = this.classList.find(c => c.standardName.toLowerCase() === className?.toLowerCase());
      const student = {
        studentId: 0,
        studentName: row[0],
        studentDOB: parseDate(row[1], true),
        studentGender: row[2] === 'Female' ? 1 : (row[2] === 'Other' ? 2 : 0),
        standardId: standard ? standard.standardId : null,
        section: row[4] || null,
        fatherName: row[5] || null,
        fatherContactNumber: row[6] || null,
        guardianPhone: row[7] || null,
        admissionDate: parseDate(row[8]),
        permanentAddress: row[9] || null,
        studentReligion: row[10] || null,
        studentBloodGroup: row[11] || null,
        studentNationality: row[12] || null,
        studentNIDNumber: row[13]?.toString() || null,
        previousSchool: row[14] || null,
        defaultDiscount: parseFloat(row[15]) || 0,
        status: 'Active',
        studentEmail: null,
        studentPassword: 'Noshahi.000',
        campusId: null,
        academicYearId: this.selectedYearId, 
        studentFees: []
      };
      students.push(student);
    }
    if (students.length === 0) { this.isProcessing = false; this.popup.error('No valid records.', 'Error'); return; }
    this.popup.loading(`Importing ${students.length} students...`);
    this.studentService.SaveStudentsBulk(students, this.selectedYearId).subscribe({
      next: () => { this.isProcessing = false; this.popup.success('Imported.', 'Success'); this.loadAllData(); },
      error: (err) => { this.isProcessing = false; this.popup.error('Failed.', 'Error'); }
    });
  }
}
