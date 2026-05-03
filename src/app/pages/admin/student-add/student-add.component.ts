import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StudentService } from '../../../services/student.service';
import { GenderList, Student } from '../../../Models/student';
import { ImageUpload } from '../../../Models/StaticImageModel/imageUpload';
import { StandardService } from '../../../services/standard.service';
import { Standard } from '../../../Models/standard';
import { OnInit } from '@angular/core';
import { SessionService } from '../../../services/session.service';
import { finalize } from 'rxjs';
import { SectionService } from '../../../services/section.service';
import { Section } from '../../../Models/section';
import { PopupService } from '../../../services/popup.service';
import { FeeService } from '../../../services/fee.service';
import { Fee } from '../../../Models/fee';

declare var bootstrap: any;

import { NgxMaskDirective } from 'ngx-mask';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-student-add',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, NgxMaskDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-add.component.html',
  styleUrls: ['./student-add.component.css']
})
export class StudentAddComponent implements OnInit, AfterViewInit {

  title = 'Add Student';
  formSubmitted = false;

  // Needed for template binding
  GenderList = GenderList;

  // -------------------------------------------------------
  // CLEAN & CORRECT Student Model Initialization
  // -------------------------------------------------------
  newStudent: Student = {
    studentId: 0,
    admissionNo: null,
    enrollmentNo: null,
    uniqueStudentAttendanceNumber: 0,

    studentName: '',
    studentDOB: new Date(), // ✅ default Date object
    studentGender: GenderList.Male,

    studentReligion: '',
    studentBloodGroup: '',
    studentNationality: '',
    studentNIDNumber: '',
    studentContactNumber1: '',
    studentContactNumber2: '',

    studentEmail: '',
    studentPassword: '',
    parentEmail: '',
    parentPassword: '',
    permanentAddress: '',
    temporaryAddress: '',

    fatherName: '',
    fatherNID: '',
    fatherContactNumber: '',

    motherName: '',
    motherNID: '',
    motherContactNumber: '',

    localGuardianName: '',
    localGuardianContactNumber: '',

    imagePath: '',
    imageUpload: new ImageUpload(), // ✅ now Base64 string type

    standardId: null,
    standard: undefined,
    guardianPhone: '',
    admissionDate: new Date(),
    previousSchool: '',
    status: '',
    section: '',
    defaultDiscount: 0
  };

  // String properties for date input binding
  studentDOBStr: string = '';
  admissionDateStr: string = '';

  classes: Standard[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];
  
  // Fee Management
  allFees: Fee[] = [];
  assignedFees: { fee: Fee; checked: boolean; amount: number }[] = [];

  // Premium Modal Visibility State
  isProcessing = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private sessionService: SessionService,
    private feeService: FeeService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadClasses();
    this.loadSections();

    // Check if a classId was passed via query params (e.g., from class-list quick action)
    this.route.queryParams.subscribe(params => {
      if (params['classId']) {
        this.newStudent.standardId = Number(params['classId']);
      }
    });

    // Initialize date strings for input binding (YYYY-MM-DD)
    this.studentDOBStr = (this.newStudent.studentDOB as any).toISOString().split('T')[0];
    this.admissionDateStr = (this.newStudent.admissionDate as any).toISOString().split('T')[0];

    // Auto-generate Enrollment Number for display (must be numeric as per model)
    const year = new Date().getFullYear().toString().slice(-2);
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    this.newStudent.enrollmentNo = parseInt(year + randomStr, 10);

    // Explicitly clear email/password to prevent some browser autofills on load
    this.newStudent.studentEmail = '';
    this.newStudent.studentPassword = '';
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.classes = res;
        // If standardId was already set (via query params), trigger filter
        if (this.newStudent.standardId) {
          this.onClassChange();
        }
      },
      error: (err) => console.error('Failed to load classes', err)
    });
  }

  loadSections() {
    this.sectionService.getSections().subscribe({
      next: (res) => {
        this.sections = res;
        // If standardId was already set (via query params), trigger filter
        if (this.newStudent.standardId) {
          this.onClassChange();
        }
      },
      error: (err) => console.error('Failed to load sections', err)
    });
  }

  onClassChange() {
    if (this.newStudent.standardId) {
      const selectedClassName = this.getClassName(this.newStudent.standardId);
      this.filteredSections = this.sections.filter(s => s.className === selectedClassName);
      this.loadFeesForClass(this.newStudent.standardId);
    } else {
      this.filteredSections = [];
      this.assignedFees = [];
    }
    // Reset section if current one isn't in filtered list
    if (this.newStudent.section && !this.filteredSections.some(s => s.sectionName === this.newStudent.section)) {
      this.newStudent.section = '';
    }
  }

  loadFeesForClass(classId: number) {
    this.feeService.getAllFees().subscribe({
      next: (res) => {
        this.allFees = res.filter(f => f.standardId === classId);
        this.assignedFees = this.allFees.map(f => ({
          fee: f,
          checked: false,
          amount: f.amount // Default amount fetched from assigned Fee
        }));
      },
      error: (err) => console.error('Failed to load fees', err)
    });
  }

  getClassName(id: number | null | undefined): string {
    if (!id) return '';
    const cls = this.classes.find(c => c.standardId === id);
    return cls ? cls.standardName : '';
  }

  // -------------------------------------------------------
  // IMAGE UPLOAD (Base64)
  // -------------------------------------------------------
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.newStudent.imageUpload.file = file;
      this.newStudent.imageUpload.getBase64 = reader.result as string; // ✅ store string
      this.newStudent.imagePath = reader.result as string; // For preview
    };
    reader.readAsDataURL(file);
  }

  getStudentImage(): string {
    const defaultImg = 'assets/images/user-grid/user-grid-img2.png';
    if (!this.newStudent.imagePath) return defaultImg;
    if (this.newStudent.imagePath.startsWith('http') || 
        this.newStudent.imagePath.startsWith('data:') || 
        this.newStudent.imagePath.startsWith('assets/')) {
      return this.newStudent.imagePath;
    }
    return this.newStudent.imagePath;
  }



  // -------------------------------------------------------
  // EMAIL CHECKING LOGIC
  // -------------------------------------------------------
  onEmailBlur(email: string | undefined): void {
    if (!email) return;

    this.studentService.CheckEmail(email).subscribe({
      next: (res) => {
        if (res.exists) {
          this.popup.warning(`The email address "${email}" is already registered. Please use a different one.`, 'Email Already Exists!');
          // Optionally clear the field:
          if (this.newStudent.studentEmail === email) this.newStudent.studentEmail = '';
          if (this.newStudent.parentEmail === email) this.newStudent.parentEmail = '';
        }
      },
      error: (err) => console.error('Error checking email', err)
    });
  }

  // -------------------------------------------------------
  // SUBMIT FORM
  // -------------------------------------------------------
  onSubmit(form: NgForm): void {
    this.formSubmitted = true;
    form.form.markAllAsTouched();

    if (form.invalid) {
      this.popup.warning('Please fill in all required fields correctly.', 'Incomplete Form');
      return;
    }

    if (!this.studentDOBStr || !this.admissionDateStr) {
      this.popup.warning('Please provide both Date of Birth and Admission Date.', 'Dates Required');
      return;
    }

    // Auto-generate hidden email and hardcode password based on requirements
    const enrollmentStr = this.newStudent.enrollmentNo?.toString() || 'student';
    this.newStudent.studentEmail = `${enrollmentStr}@visioncollegegojra.com`;
    this.newStudent.studentPassword = 'Noshahi.000';

    this.isProcessing = true;
    this.popup.loading('Validating details...');

    if (this.newStudent.studentEmail) {
      this.studentService.CheckEmail(this.newStudent.studentEmail).subscribe({
        next: (res) => {
          if (res.exists) {
            this.isProcessing = false;
            this.popup.closeLoading();
            this.popup.warning(`The email address "${this.newStudent.studentEmail}" is already registered.`, 'Email Already Exists!');
            this.newStudent.studentEmail = '';
            this.newStudent.studentPassword = '';
          } else {
            this.saveStudentData();
          }
        },
        error: (err) => {
          console.error('Error checking email', err);
          this.isProcessing = false;
          this.popup.closeLoading();
          this.popup.error('Unable to validate email at this time.', 'Validation Error');
        }
      });
    } else {
      this.saveStudentData();
    }
  }

  private saveStudentData(): void {
    // Prepare payload exactly for backend
    const studentToSave: any = {
      studentId: this.newStudent.studentId,
      admissionNo: this.newStudent.admissionNo,
      enrollmentNo: this.newStudent.enrollmentNo,
      uniqueStudentAttendanceNumber: 0,
      studentName: this.newStudent.studentName,
      studentDOB: this.studentDOBStr,
      studentGender: this.newStudent.studentGender,
      studentReligion: this.newStudent.studentReligion || null,
      studentBloodGroup: this.newStudent.studentBloodGroup || null,
      studentNationality: this.newStudent.studentNationality || null,
      studentNIDNumber: this.newStudent.studentNIDNumber || null,
      studentContactNumber1: this.newStudent.studentContactNumber1 || null,
      studentContactNumber2: this.newStudent.studentContactNumber2 || null,
      studentEmail: this.newStudent.studentEmail || null,
      studentPassword: this.newStudent.studentPassword || null,
      parentEmail: this.newStudent.parentEmail || null,
      parentPassword: this.newStudent.parentPassword || null,
      permanentAddress: this.newStudent.permanentAddress || null,
      temporaryAddress: this.newStudent.temporaryAddress || null,
      fatherName: this.newStudent.fatherName || null,
      fatherNID: this.newStudent.fatherNID || null,
      fatherContactNumber: this.newStudent.fatherContactNumber || null,
      motherName: this.newStudent.motherName || null,
      motherNID: this.newStudent.motherNID || null,
      motherContactNumber: this.newStudent.motherContactNumber || null,
      localGuardianName: this.newStudent.localGuardianName || null,
      localGuardianContactNumber: this.newStudent.localGuardianContactNumber || null,
      guardianPhone: this.newStudent.guardianPhone || null,
      admissionDate: this.admissionDateStr,
      previousSchool: this.newStudent.previousSchool || null,
      status: this.newStudent.status || null,
      section: this.newStudent.section || null,
      standardId: this.newStudent.standardId || null,
      defaultDiscount: this.newStudent.defaultDiscount || 0,
      academicYearId: this.sessionService.getCurrentYearId(),
      studentFees: this.assignedFees.filter(af => af.checked).map(af => ({
        feeId: af.fee.feeId,
        assignedAmount: af.amount
      })),
      imageUpload: this.newStudent.imageUpload.getBase64 ? {
        imageData: this.newStudent.imageUpload.getBase64,
        imageName: this.newStudent.imageUpload.file?.name || 'student_photo.png'
      } : null
    };

    this.popup.loading('Registering Student...');

    this.studentService.SaveStudent(studentToSave).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: () => {
        this.popup.closeLoading();
        this.popup.success('Student has been registered in the system.', 'Enrolled Successfully');
        setTimeout(() => {
          this.router.navigate(['/student-list']);
        }, 1500);
      },
      error: err => {
        console.error('Error while saving student', err);
        this.popup.closeLoading();
        const errorMsg = err.error && typeof err.error === 'string'
          ? err.error
          : (err.error?.message ? err.error.message : 'Failed to save student. Please check all fields.');
        this.popup.error(errorMsg, 'Enrollment Failed');
      }
    });
  }

  // -------------------------------------------------------
  // BULK IMPORT LOGIC (EXCEL)
  // -------------------------------------------------------
  downloadTemplate(): void {
    // ── Column Headers (26 fields matching the student form) ──
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

    // ── Example data rows ──
    const dataSheet = [
      headers,
      [
        'Ali Hassan', '15-05-2010', 'Male',
        this.classes[0]?.standardName || '9th',
        this.sections[0]?.sectionName || 'A',
        'Active', '01-04-2026',
        '03001234567', '',
        'Ahmad Hassan', '33101-1234567-1', '03001234567',
        'Fatima Bibi', '33101-9876543-8', '03009876543',
        '03001234567',
        '', '',
        'House No 12, Street 4, Gojra', '',
        'Islam', 'O+', 'Pakistani', '33101-1234567-1',
        'City Model School', '0'
      ],
      [
        'Ayesha Noor', '20-10-2012', 'Female',
        this.classes[1]?.standardName || '10th',
        this.sections[1]?.sectionName || 'B',
        'Active', '01-04-2026',
        '03007654321', '',
        'Noor Ahmad', '33101-7654321-1', '03007654321',
        'Zainab Bibi', '', '',
        '03007654321',
        '', '',
        'House No 5, Model Town, Gojra', '',
        'Islam', 'A+', 'Pakistani', '',
        'Vision Public School', '500'
      ]
    ];

    const wsData = XLSX.utils.aoa_to_sheet(dataSheet);

    // Column widths for Data sheet
    wsData['!cols'] = [
      { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
      { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 30 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 25 }, { wch: 20 }
    ];

    // ── Instruction Sheet ──
    const instData: any[][] = [
      ['=== STUDENT BULK IMPORT INSTRUCTIONS ===', '', '', ''],
      ['Please read every row carefully before filling your data sheet.', '', '', ''],
      [''],
      ['COLUMN NAME', 'REQUIRED?', 'FORMAT / VALID VALUES', 'EXAMPLE'],
      ['Student Name', 'YES', 'Full legal name of the student', 'Ali Hassan'],
      ['Date of Birth', 'YES', 'DD-MM-YYYY — day first, then month, then 4-digit year', '15-05-2010'],
      ['Gender', 'YES', 'Exact spelling: Male  OR  Female  OR  Other', 'Male'],
      ['Class Name', 'YES', 'Must match exactly one of the Class Names listed below (Section A)', this.classes[0]?.standardName || '9th'],
      ['Section Name', 'YES', 'Must match exactly one of the Section Names listed below (Section B)', this.sections[0]?.sectionName || 'A'],
      ['Enrollment Status', 'NO', 'Active  OR  Inactive   (leave blank = Active)', 'Active'],
      ['Admission Date', 'NO', 'DD-MM-YYYY format — date the student joined', '01-04-2026'],
      ['Student Contact Number', 'NO', 'Pakistani mobile format: 03XXXXXXXXX (11 digits, no dashes)', '03001234567'],
      ['Student Contact Number 2', 'NO', 'Second number if available, same format as above', ''],
      ['Father Name', 'NO', 'Full name of father or primary male guardian', 'Ahmad Hassan'],
      ['Father NID', 'NO', 'Pakistani NID format: XXXXX-XXXXXXX-X (15 characters)', '33101-1234567-1'],
      ['Father Contact Number', 'NO', 'Pakistani mobile format: 03XXXXXXXXX', '03001234567'],
      ['Mother Name', 'NO', 'Full name of mother or primary female guardian', 'Fatima Bibi'],
      ['Mother NID', 'NO', 'Pakistani NID format: XXXXX-XXXXXXX-X', '33101-9876543-8'],
      ['Mother Contact Number', 'NO', 'Pakistani mobile format: 03XXXXXXXXX', '03009876543'],
      ['Guardian Phone', 'NO', 'Primary contact number to reach guardian', '03001234567'],
      ['Local Guardian Name', 'NO', 'Name of local guardian if parents are not in city', ''],
      ['Local Guardian Contact', 'NO', 'Pakistani mobile format: 03XXXXXXXXX', ''],
      ['Permanent Address', 'NO', 'Full home address including house no, street, city', 'House 12, Street 4, Gojra'],
      ['Temporary Address', 'NO', 'Current residence if different from permanent address', ''],
      ['Religion', 'NO', 'e.g. Islam, Christianity, Hinduism', 'Islam'],
      ['Blood Group', 'NO', 'Valid values: A+  A-  B+  B-  AB+  AB-  O+  O-', 'O+'],
      ['Nationality', 'NO', 'e.g. Pakistani, British, American', 'Pakistani'],
      ['Student NID Number', 'NO', 'If student has NID: XXXXX-XXXXXXX-X format', ''],
      ['Previous School', 'NO', 'Name of school student attended before this institution', 'City Model School'],
      ['Default Discount (Rs)', 'NO', 'Monthly fee discount in Rupees (number only, no Rs symbol). 0 if none.', '500'],
      [''],
      ['IMPORTANT NOTES:', '', '', ''],
      ['1. Do NOT edit the column headers in the Student Data sheet.', '', '', ''],
      ['2. Do NOT add extra columns — only fill the provided ones.', '', '', ''],
      ['3. Leave optional fields BLANK (empty) if not available. Do NOT write "N/A" or "-".', '', '', ''],
      ['4. Dates MUST be in DD-MM-YYYY format (e.g. 25-12-2010, NOT 2010-12-25).', '', '', ''],
      ['5. Class Name and Section Name must match EXACTLY as listed below — check spelling carefully.', '', '', ''],
      ['6. Phone numbers must be 11 digits starting with 03 (e.g. 03001234567). No dashes.', '', '', ''],
      ['7. The system auto-generates Admission Number, Enrollment Number, and Attendance ID.', '', '', ''],
      ['8. Default password for student login will be: Noshahi.000', '', '', ''],
      [''],
      ['─── SECTION A: VALID CLASS NAMES (copy exactly) ───', '', '', ''],
      ['Class Name', 'Class ID', '', ''],
      ...this.classes.map(c => [c.standardName, c.standardId, '', '']),
      [''],
      ['─── SECTION B: VALID SECTIONS PER CLASS (use ONLY these) ───', '', '', ''],
      ['Class Name', 'Section Name', 'Section Code', ''],
      ...this.classes.flatMap(c => {
        const classSections = this.sections.filter(s => s.className === c.standardName);
        if (classSections.length === 0) return [[c.standardName, '(no sections added yet)', '', '']];
        return classSections.map(s => [c.standardName, s.sectionName, s.sectionCode || '', '']);
      }),
      [''],
      ['─── SECTION C: GENDER OPTIONS ───', '', '', ''],
      ['Male', '', '', ''],
      ['Female', '', '', ''],
      ['Other', '', '', ''],
    ];

    const wsInst = XLSX.utils.aoa_to_sheet(instData);
    wsInst['!cols'] = [{ wch: 35 }, { wch: 14 }, { wch: 60 }, { wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Student Data');
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions');

    XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
    this.popup.success('Template downloaded. Read the "Instructions" sheet before filling data.', 'Template Ready');
  }


  triggerImport(): void {
    const fileInput = document.getElementById('excelImport') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onImportExcel(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isProcessing = true;
    this.popup.loading('Reading Excel file...');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      this.processImportedData(jsonData);
      // Clear input
      event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  private processImportedData(data: any[]): void {
    if (data.length <= 1) {
      this.isProcessing = false;
      this.popup.error('The Excel sheet appears to be empty.', 'Import Error');
      return;
    }

    const students: any[] = [];
    const rows = data.slice(1); // Skip header row

    for (const row of rows) {
      if (!row[0]) continue; // Skip empty rows

      // Helper to parse DD-MM-YYYY to ISO String
      const parseDate = (dateStr: any, isRequired = false) => {
        let date: Date;
        if (!dateStr) {
          date = new Date();
        } else if (typeof dateStr === 'number') {
          date = new Date((dateStr - 25569) * 86400 * 1000);
        } else {
          const parts = dateStr.toString().split('-');
          if (parts.length === 3) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            date = new Date(dateStr);
          }
        }
        if (isNaN(date.getTime())) {
          return isRequired ? new Date().toISOString() : null;
        }
        return date.toISOString();
      };

      // Column mapping (0-indexed, matches 26-column template):
      // 0: Student Name       1: DOB              2: Gender
      // 3: Class Name         4: Section Name      5: Status
      // 6: Admission Date     7: Contact 1         8: Contact 2
      // 9: Father Name        10: Father NID       11: Father Contact
      // 12: Mother Name       13: Mother NID       14: Mother Contact
      // 15: Guardian Phone    16: Local Guard Name 17: Local Guard Contact
      // 18: Permanent Addr    19: Temporary Addr   20: Religion
      // 21: Blood Group       22: Nationality      23: Student NID
      // 24: Previous School   25: Discount

      const className = row[3]?.toString().trim();
      const standard = this.classes.find(c => c.standardName.toLowerCase() === className?.toLowerCase());

      const genderRaw = row[2]?.toString().trim().toLowerCase();
      const gender = genderRaw === 'female' ? 1 : (genderRaw === 'other' ? 2 : 0);

      const statusRaw = row[5]?.toString().trim().toLowerCase();
      const status = statusRaw === 'inactive' ? 'Inactive' : 'Active';


      const sectionInput = row[4]?.toString().trim() || null;

      // Match section by name AND by class — 10th student gets only 10th class section
      let matchedSection = null;
      if (sectionInput && standard) {
        // Try exact sectionName match for the same class
        matchedSection = this.sections.find(s =>
          s.className?.toLowerCase() === standard.standardName.toLowerCase() &&
          s.sectionName.toLowerCase() === sectionInput.toLowerCase()
        );
        // Fallback: match by section code letter (e.g., "A") for the same class
        if (!matchedSection) {
          matchedSection = this.sections.find(s =>
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
        section: matchedSection ? matchedSection.sectionName : null,  // null if section not in DB
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
        academicYearId: this.sessionService.getCurrentYearId(),
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

    this.studentService.SaveStudentsBulk(students, this.sessionService.getCurrentYearId()).subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.popup.success(`${students.length} students have been imported successfully.`, 'Bulk Import Success');
        setTimeout(() => this.router.navigate(['/student-list']), 2000);
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('SERVER ERROR (400):', err);
        let errorMsg = 'Failed to import students. Please check your data.';
        if (err.error && typeof err.error === 'object') {
          if (err.error.errors) {
            const firstError = Object.values(err.error.errors)[0];
            if (Array.isArray(firstError)) errorMsg = firstError[0] as string;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          }
        }
        this.popup.error(errorMsg, 'Import Failed');
      }
    });
  }




  cancel(): void {
    this.router.navigate(['/student-list']);
  }

  ngAfterViewInit(): void { }
}


