import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
declare var $: any;

@Component({
  selector: 'app-staff-job-letter',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-job-letter.component.html',
  styleUrl: './staff-job-letter.component.css'
})
export class StaffJobLetterComponent implements AfterViewInit {
  todayDate = new Date();
  private readonly STORAGE_KEY = 'staffList';

  // Search properties
  searchTerm: string = '';
  staffList: any[] = [];
  filteredStaffList: any[] = [];
  selectedStaff: any = null;
  showLetter: boolean = false;

  // Default teacher data (fallback)
  teacher = {
    name: 'Select a staff member',
    designation: 'N/A',
    subject: 'N/A',
    joiningDate: new Date(),
    salary: 0,
    address: 'N/A',
    city: 'N/A'
  };

  ngOnInit(): void {
    this.loadStaffList();
  }

  ngAfterViewInit(): void {
    // Component initialized
  }

  // Load staff from localStorage
  loadStaffList(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    this.staffList = data ? JSON.parse(data) : [];
    this.filteredStaffList = this.staffList;
  }

  // Search staff
  searchStaff(): void {
    if (!this.searchTerm.trim()) {
      this.filteredStaffList = this.staffList;
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredStaffList = this.staffList.filter(staff =>
      staff.name.toLowerCase().includes(search) ||
      staff.email?.toLowerCase().includes(search) ||
      staff.cnic?.includes(search) ||
      staff.phone?.includes(search)
    );
  }

  // Select staff and show letter
  selectStaff(staff: any): void {
    this.selectedStaff = staff;
    this.teacher = {
      name: staff.name,
      designation: staff.role || staff.designation || 'Staff Member',
      subject: staff.section || 'General',
      joiningDate: new Date(staff.joiningDate),
      salary: 0, // You can add salary field to staff data
      address: staff.address,
      city: 'Lahore' // You can extract from address or add city field
    };
    this.showLetter = true;
    this.searchTerm = '';
    this.filteredStaffList = [];
  }

  // Scan CNIC functionality
  scanCNIC(): void {
    const cnic = prompt('Enter CNIC to search (e.g., 35202-1234567-8):');
    if (cnic) {
      this.searchTerm = cnic;
      this.searchStaff();
    }
  }

  printLetter() {
    const printContents = document.getElementById('appointmentLetter')?.innerHTML;
    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow && printContents) {
      printWindow.document.write('<html><head><title>Teacher Appointment Letter</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  }

  downloadPdf() {
    alert('PDF download feature will be added here.');
  }

  editLetter() {
    alert('Edit mode will open a form to update teacher details.');
  }

  sendSms() {
    alert(`SMS sent to ${this.teacher.name}!`);
  }


}
