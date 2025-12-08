import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

interface Student {
  id: number;
  serialNo: number;
  name: string;
  rollNo: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Late' | '';
  remarks: string;
}

interface AttendanceHistory {
  date: string;
  present: number;
  absent: number;
  leave: number;
  late: number;
  total: number;
}

declare var bootstrap: any;

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AttendanceComponent implements OnInit {
  title = 'Student Attendance';

  // Filters
  selectedClass: string = '';
  selectedSection: string = '';
  selectedDate: string = '';

  // Filter Options
  classes: string[] = [];
  sections = ['A', 'B', 'C', 'D'];

  // Student Data
  students: Student[] = [];
  studentsLoaded = false;

  // Pagination & Search
  itemsPerPage: number = 10;
  currentPage: number = 1;
  searchQuery: string = '';

  // Attendance History
  attendanceHistory: AttendanceHistory[] = [];
  historyStartDate: string = '';
  historyEndDate: string = '';

  // Status options
  statusOptions = ['Present', 'Absent', 'Leave', 'Late'];

  ngOnInit(): void {
    this.loadClasses();
    this.setTodayDate();
    this.generateDummyHistory();
  }

  setTodayDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  loadClasses(): void {
    const savedClasses = localStorage.getItem('classList');
    if (savedClasses) {
      const classList = JSON.parse(savedClasses);
      this.classes = classList.map((c: any) => c.className);
    } else {
      this.classes = ['9', '10', '11', '12'];
    }
  }

  loadStudents(): void {
    if (!this.selectedClass || !this.selectedSection || !this.selectedDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Filters',
        text: 'Please select , Class, Section, and Date before loading students.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    // Generate dummy students
    this.students = this.generateDummyStudents();
    this.studentsLoaded = true;

    Swal.fire({
      icon: 'success',
      title: 'Students Loaded',
      text: `${this.students.length} students loaded successfully.`,
      timer: 1500,
      showConfirmButton: false
    });
  }

  generateDummyStudents(): Student[] {
    const names = [
      'Ahmed Ali', 'Fatima Khan', 'Hassan Raza', 'Ayesha Malik',
      'Bilal Ahmed', 'Zainab Hassan', 'Usman Tariq', 'Maryam Noor',
      'Abdullah Shah', 'Hira Fatima', 'Hamza Iqbal', 'Sana Riaz',
      'Arslan Javed', 'Nida Khalid', 'Faisal Mahmood', 'Rabia Akram',
      'Kamran Ali', 'Amna Yousaf', 'Shahzad Hussain', 'Mahnoor Asif'
    ];

    return names.map((name, index) => ({
      id: index + 1,
      serialNo: index + 1,
      name: name,
      rollNo: `${this.selectedClass}-${this.selectedSection}-${String(index + 1).padStart(3, '0')}`,
      status: '',
      remarks: ''
    }));
  }

  markAllPresent(): void {
    this.students.forEach(student => student.status = 'Present');
    Swal.fire({
      icon: 'success',
      title: 'All Marked Present',
      timer: 1000,
      showConfirmButton: false
    });
  }

  markAllAbsent(): void {
    this.students.forEach(student => student.status = 'Absent');
    Swal.fire({
      icon: 'info',
      title: 'All Marked Absent',
      timer: 1000,
      showConfirmButton: false
    });
  }

  async saveAttendance(): Promise<void> {
    const unmarked = this.students.filter(s => !s.status);
    if (unmarked.length > 0) {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Attendance',
        text: `${unmarked.length} student(s) have no status marked. Continue anyway?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, Save',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#800020',
        cancelButtonColor: '#6c757d'
      });

      if (!result.isConfirmed) return;
    }

    // Save to localStorage
    const attendanceData = {
      date: this.selectedDate,
      class: this.selectedClass,
      section: this.selectedSection,
      students: this.students,
      savedAt: new Date().toISOString()
    };

    const savedAttendance = JSON.parse(localStorage.getItem('studentAttendance') || '[]');
    savedAttendance.push(attendanceData);
    localStorage.setItem('studentAttendance', JSON.stringify(savedAttendance));

    await Swal.fire({
      icon: 'success',
      title: 'Attendance Saved!',
      text: 'Student attendance has been saved successfully.',
      confirmButtonColor: '#800020'
    });

    this.resetForm();
  }

  resetForm(): void {
    this.students = [];
    this.studentsLoaded = false;
    this.selectedClass = '';
    this.selectedSection = '';
    this.setTodayDate();
  }

  openHistoryModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
  }

  generateDummyHistory(): void {
    const today = new Date();
    this.attendanceHistory = [];

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const total = 20;
      const present = Math.floor(Math.random() * 5) + 15;
      const absent = Math.floor(Math.random() * 3);
      const leave = Math.floor(Math.random() * 2);
      const late = total - present - absent - leave;

      this.attendanceHistory.push({
        date: date.toISOString().split('T')[0],
        present,
        absent,
        leave,
        late,
        total
      });
    }
  }

  get filteredHistory(): AttendanceHistory[] {
    if (!this.historyStartDate && !this.historyEndDate) {
      return this.attendanceHistory;
    }

    return this.attendanceHistory.filter(record => {
      const recordDate = new Date(record.date);
      const start = this.historyStartDate ? new Date(this.historyStartDate) : null;
      const end = this.historyEndDate ? new Date(this.historyEndDate) : null;

      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
      return true;
    });
  }

  get filteredStudents(): Student[] {
    if (!this.searchQuery) {
      return this.students;
    }
    const query = this.searchQuery.toLowerCase();
    return this.students.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.rollNo.toLowerCase().includes(query)
    );
  }

  get paginatedStudents(): Student[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredStudents.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredStudents.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get paginationEnd(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.filteredStudents.length ? this.filteredStudents.length : end;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get attendanceStats() {
    const present = this.students.filter(s => s.status === 'Present').length;
    const absent = this.students.filter(s => s.status === 'Absent').length;
    const leave = this.students.filter(s => s.status === 'Leave').length;
    const late = this.students.filter(s => s.status === 'Late').length;
    const unmarked = this.students.filter(s => !s.status).length;

    return { present, absent, leave, late, unmarked, total: this.students.length };
  }
}
