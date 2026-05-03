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
    let section = student.section?.trim() || null;
    if (this.isTeacher && (!section || section === '')) {
      const assigned = this.assignedSections.find(sec => sec.className === this.getClassName(student.standardId));
      if (assigned) section = assigned.sectionCode || 'A';
    }
    if (!section) return className;
    // Strip class-suffix from section names like "Section A - 12th" → "Section A"
    const cleanSection = section.replace(/\s*-\s*\d+(th|st|nd|rd|st)?\s*$/i, '').trim();
    // Avoid double-prefix: if already starts with 'section', use as-is
    const sectionDisplay = cleanSection.toLowerCase().startsWith('section') ? cleanSection : `Section ${cleanSection}`;
    return `${className} ${sectionDisplay}`;
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
      'Student Name*',
      'Date of Birth (DD-MM-YYYY)*',
      'Gender*',
      'Class Name*',
      'Section Name*',
      'Enrollment Status',
      'Admission Date (DD-MM-YYYY)',
      'Student Contact Number',
      'Student Contact Number 2',
      'Father Name',
      'Father NID',
      'Father Contact Number',
      'Mother Name',
      'Mother NID',
      'Mother Contact Number',
      'Guardian Phone',
      'Local Guardian Name',
      'Local Guardian Contact',
      'Permanent Address',
      'Temporary Address',
      'Religion',
      'Blood Group',
      'Nationality',
      'Student NID Number',
      'Previous School',
      'Default Discount (Rs)'
    ];

    const dataSheet = [
      headers,
      [
        'Ali Hassan', '15-05-2010', 'Male',
        this.classList[0]?.standardName || '9th',
        this.sectionList[0]?.sectionName || 'A',
        'Active', '01-04-2026',
        '03001234567', '',
        'Ahmad Hassan', '33101-1234567-1', '03001234567',
        'Fatima Bibi', '33101-9876543-8', '03009876543',
        '03001234567', '', '',
        'House No 12, Street 4, Gojra', '',
        'Islam', 'O+', 'Pakistani', '33101-1234567-1',
        'City Model School', '0'
      ],
      [
        'Ayesha Noor', '20-10-2012', 'Female',
        this.classList[1]?.standardName || '10th',
        this.sectionList[1]?.sectionName || 'B',
        'Active', '01-04-2026',
        '03007654321', '',
        'Noor Ahmad', '33101-7654321-1', '03007654321',
        'Zainab Bibi', '', '',
        '03007654321', '', '',
        'House No 5, Model Town, Gojra', '',
        'Islam', 'A+', 'Pakistani', '',
        'Vision Public School', '500'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataSheet);
    ws['!cols'] = [
      { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
      { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 30 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 25 }, { wch: 20 }
    ];

    const instData: any[][] = [
      ['=== STUDENT BULK IMPORT INSTRUCTIONS ===', '', '', ''],
      ['Please read every row carefully before filling your data sheet.', '', '', ''],
      [''],
      ['COLUMN NAME', 'REQUIRED?', 'FORMAT / VALID VALUES', 'EXAMPLE'],
      ['Student Name', 'YES', 'Full legal name of the student', 'Ali Hassan'],
      ['Date of Birth', 'YES', 'DD-MM-YYYY — day first, then month, then 4-digit year', '15-05-2010'],
      ['Gender', 'YES', 'Exact spelling: Male  OR  Female  OR  Other', 'Male'],
      ['Class Name', 'YES', 'Must match exactly one of the Class Names in Section A below', this.classList[0]?.standardName || '9th'],
      ['Section Name', 'YES', 'Must match exactly one of the Section Names in Section B below', this.sectionList[0]?.sectionName || 'A'],
      ['Enrollment Status', 'NO', 'Active  OR  Inactive  (leave blank = Active)', 'Active'],
      ['Admission Date', 'NO', 'DD-MM-YYYY format — date the student joined', '01-04-2026'],
      ['Student Contact Number', 'NO', 'Pakistani mobile: 03XXXXXXXXX (11 digits, no dashes)', '03001234567'],
      ['Student Contact Number 2', 'NO', 'Second number if available, same format', ''],
      ['Father Name', 'NO', 'Full name of father or primary male guardian', 'Ahmad Hassan'],
      ['Father NID', 'NO', 'Pakistani NID: XXXXX-XXXXXXX-X (15 chars)', '33101-1234567-1'],
      ['Father Contact Number', 'NO', 'Pakistani mobile: 03XXXXXXXXX', '03001234567'],
      ['Mother Name', 'NO', 'Full name of mother or primary female guardian', 'Fatima Bibi'],
      ['Mother NID', 'NO', 'Pakistani NID: XXXXX-XXXXXXX-X', '33101-9876543-8'],
      ['Mother Contact Number', 'NO', 'Pakistani mobile: 03XXXXXXXXX', '03009876543'],
      ['Guardian Phone', 'NO', 'Primary contact to reach guardian', '03001234567'],
      ['Local Guardian Name', 'NO', 'Local guardian name if parents not in city', ''],
      ['Local Guardian Contact', 'NO', 'Pakistani mobile: 03XXXXXXXXX', ''],
      ['Permanent Address', 'NO', 'Full home address: house no, street, city', 'House 12, Street 4, Gojra'],
      ['Temporary Address', 'NO', 'Current residence if different from permanent', ''],
      ['Religion', 'NO', 'e.g. Islam, Christianity, Hinduism', 'Islam'],
      ['Blood Group', 'NO', 'A+  A-  B+  B-  AB+  AB-  O+  O-', 'O+'],
      ['Nationality', 'NO', 'e.g. Pakistani, British, American', 'Pakistani'],
      ['Student NID Number', 'NO', 'If student has NID: XXXXX-XXXXXXX-X', ''],
      ['Previous School', 'NO', 'Name of previous institution', 'City Model School'],
      ['Default Discount (Rs)', 'NO', 'Monthly fee discount in Rupees (number only). 0 if none.', '500'],
      [''],
      ['IMPORTANT NOTES:', '', '', ''],
      ['1. Do NOT edit the column headers row in the Student Data sheet.', '', '', ''],
      ['2. Do NOT add extra columns — only fill the provided ones.', '', '', ''],
      ['3. Leave optional fields BLANK if not available. Do NOT write N/A or -.', '', '', ''],
      ['4. Dates MUST be DD-MM-YYYY (e.g. 25-12-2010, NOT 2010-12-25).', '', '', ''],
      ['5. Class Name and Section Name must match EXACTLY as listed below.', '', '', ''],
      ['6. Phone numbers must be 11 digits starting with 03 (no dashes).', '', '', ''],
      ['7. System auto-generates Admission No, Enrollment No, and Attendance ID.', '', '', ''],
      ['8. Default student login password will be: Noshahi.000', '', '', ''],
      [''],
      ['─── SECTION A: VALID CLASS NAMES (copy exactly) ───', '', '', ''],
      ['Class Name', 'Class ID', '', ''],
      ...this.classList.map(c => [c.standardName, c.standardId, '', '']),
      [''],
      ['─── SECTION B: VALID SECTIONS PER CLASS (use ONLY these) ───', '', '', ''],
      ['Class Name', 'Section Name', 'Section Code', ''],
      ...this.classList.flatMap(c => {
        const classSections = this.sectionList.filter(s => s.className === c.standardName);
        if (classSections.length === 0) return [[c.standardName, '(no sections added yet)', '', '']];
        return classSections.map(s => [c.standardName, s.sectionName, s.sectionCode || '', '']);
      }),
      [''],
      ['─── SECTION C: GENDER OPTIONS ───', '', '', ''],
      ['Male', '', '', ''],
      ['Female', '', '', ''],
      ['Other', '', '', ''],
    ];

    const instWs = XLSX.utils.aoa_to_sheet(instData);
    instWs['!cols'] = [{ wch: 35 }, { wch: 14 }, { wch: 60 }, { wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Data');
    XLSX.utils.book_append_sheet(wb, instWs, 'Instructions');
    XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
    this.popup.success('Template downloaded. Read the "Instructions" sheet before filling data.', 'Template Ready');
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
    const rows = data.slice(1); // Skip header row
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
      const genderRaw = row[2]?.toString().trim().toLowerCase();
      const gender = genderRaw === 'female' ? 1 : (genderRaw === 'other' ? 2 : 0);
      const statusRaw = row[5]?.toString().trim().toLowerCase();
      const status = statusRaw === 'inactive' ? 'Inactive' : 'Active';

      const sectionInput = row[4]?.toString().trim() || null;

      // Match section by name AND by class — so a 10th class student only gets a 10th class section
      let matchedSection = null;
      if (sectionInput && standard) {
        // Try: exact sectionName match for the same class
        matchedSection = this.sectionList.find(s =>
          s.className?.toLowerCase() === standard.standardName.toLowerCase() &&
          s.sectionName.toLowerCase() === sectionInput.toLowerCase()
        );
        // Fallback: match just the section code letter (e.g. "A") for the same class
        if (!matchedSection) {
          matchedSection = this.sectionList.find(s =>
            s.className?.toLowerCase() === standard.standardName.toLowerCase() &&
            (s.sectionCode?.toLowerCase() === sectionInput.toLowerCase() ||
             s.sectionName.toLowerCase().includes(sectionInput.toLowerCase()))
          );
        }
      }

      const student = {
        studentId: 0,
        studentName: row[0]?.toString().trim() || null,
        studentDOB: parseDate(row[1], true),
        studentGender: gender,
        standardId: standard ? standard.standardId : null,
        sectionId: matchedSection ? matchedSection.sectionId : null,
        section: matchedSection ? matchedSection.sectionName : null,  // null if section not found in DB
        status: status,
        admissionDate: parseDate(row[6]),
        studentContactNumber1: row[7]?.toString().trim() || null,
        studentContactNumber2: row[8]?.toString().trim() || null,
        fatherName: row[9]?.toString().trim() || null,
        fatherNID: row[10]?.toString().trim() || null,
        fatherContactNumber: row[11]?.toString().trim() || null,
        motherName: row[12]?.toString().trim() || null,
        motherNID: row[13]?.toString().trim() || null,
        motherContactNumber: row[14]?.toString().trim() || null,
        guardianPhone: row[15]?.toString().trim() || null,
        localGuardianName: row[16]?.toString().trim() || null,
        localGuardianContactNumber: row[17]?.toString().trim() || null,
        permanentAddress: row[18]?.toString().trim() || null,
        temporaryAddress: row[19]?.toString().trim() || null,
        studentReligion: row[20]?.toString().trim() || null,
        studentBloodGroup: row[21]?.toString().trim() || null,
        studentNationality: row[22]?.toString().trim() || null,
        studentNIDNumber: row[23]?.toString().trim() || null,
        previousSchool: row[24]?.toString().trim() || null,
        defaultDiscount: parseFloat(row[25]) || 0,
        studentEmail: null,
        studentPassword: 'Noshahi.000',
        campusId: null,
        academicYearId: this.selectedYearId,
        studentFees: []
      };
      students.push(student);
    }

    if (students.length === 0) {
      this.isProcessing = false;
      this.popup.error('No valid student records found in the sheet.', 'Import Error');
      return;
    }

    this.popup.loading(`Importing ${students.length} students...`);
    this.studentService.SaveStudentsBulk(students, this.selectedYearId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.success(`${students.length} students imported successfully.`, 'Success');
        this.loadAllData();
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Import Error:', err);
        let errorMsg = 'Failed to import. Please check Excel data.';
        if (err.error?.errors) {
          errorMsg = Object.values(err.error.errors)[0] as string;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        this.popup.error(errorMsg, 'Import Failed');
      }
    });
  }
}
