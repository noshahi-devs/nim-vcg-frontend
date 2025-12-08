import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

declare var bootstrap: any;

interface Login {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  campus: string;
  phone: string;
  status: string;
  createdOn: string;
}

@Component({
  selector: 'app-staff-manage-login',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-manage-login.component.html',
  styleUrls: ['./staff-manage-login.component.css']
})
export class StaffManageLoginComponent implements OnInit {
  title = 'Manage Logins';
  Math = Math; // For template usage

  // Data
  logins: Login[] = [];
  filteredLogins: Login[] = [];

  // Dialog
  showDialog: boolean = false;
  isEditMode: boolean = false;

  // Modal states
  modalMessage: string = '';
  modalType: 'success' | 'error' | 'confirm' = 'success';
  deleteTarget: Login | null = null;

  // Form Data
  loginForm: Login = this.getEmptyForm();
  confirmPassword: string = '';

  // Dropdowns
  roles = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Principal', value: 'Principal' },
    { label: 'Teacher', value: 'Teacher' },
    { label: 'Accountant', value: 'Accountant' }
  ];

  campuses = [
    { label: 'Main Campus', value: 'Main Campus' },
    { label: 'Girls Campus', value: 'Girls Campus' },
    { label: 'Boys Campus', value: 'Boys Campus' }
  ];

  // Search & Pagination
  searchTerm: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;

  ngOnInit(): void {
    this.loadStaffData();
  }

  // Show modal by ID
  showModal(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // Hide modal by ID
  hideModal(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
  }

  loadStaffData(): void {
    // Load from localStorage
    const savedLogins = localStorage.getItem('staffLogins');
    
    if (savedLogins) {
      this.logins = JSON.parse(savedLogins);
    } else {
      // Load staff data from staff list
      const staffData = localStorage.getItem('staffList');
      
      if (staffData) {
        const staffList = JSON.parse(staffData);
        
        this.logins = staffList.map((staff: any, index: number) => ({
          id: index + 1,
          name: staff.name,
          email: staff.email || `${staff.name.toLowerCase().replace(/\s+/g, '.')}@noshahi.edu.pk`,
          password: 'password123', // Default password
          role: staff.role || staff.designation || 'Teacher',
          campus: 'Main Campus', // Default campus
          phone: staff.phone || staff.cnic || 'N/A',
          status: staff.status || 'Active',
          createdOn: staff.joiningDate || new Date().toISOString().split('T')[0]
        }));
        
        // Save to staffLogins for future use
        this.saveToLocalStorage();
      } else {
        // Default mock data if no staff exists
        this.logins = [
          { id: 1, name: 'Ali Khan', email: 'ali@noshahi.edu.pk', role: 'Teacher', campus: 'Main Campus', phone: '0300-1234567', status: 'Active', createdOn: '2023-02-10' },
          { id: 2, name: 'Sara Ahmed', email: 'sara@noshahi.edu.pk', role: 'Principal', campus: 'Girls Campus', phone: '0301-6543210', status: 'Inactive', createdOn: '2022-11-25' }
        ];
      }
    }
    
    this.filteredLogins = [...this.logins];
  }

  saveToLocalStorage(): void {
    localStorage.setItem('staffLogins', JSON.stringify(this.logins));
  }

  getEmptyForm(): Login {
    return {
      id: 0,
      name: '',
      email: '',
      password: '',
      role: '',
      campus: '',
      phone: '',
      status: 'Active',
      createdOn: new Date().toISOString().split('T')[0]
    };
  }

  // Dialog Methods
  openAddDialog(): void {
    this.isEditMode = false;
    this.loginForm = this.getEmptyForm();
    this.confirmPassword = '';
    this.showDialog = true;
  }

  openEditDialog(login: Login): void {
    this.isEditMode = true;
    this.loginForm = { ...login };
    this.confirmPassword = '';
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.loginForm = this.getEmptyForm();
    this.confirmPassword = '';
  }

  // CRUD Operations
  saveLogin(): void {
    // Validation
    if (!this.loginForm.name || !this.loginForm.email || !this.loginForm.role || !this.loginForm.campus || !this.loginForm.phone) {
      this.modalMessage = 'Please fill all required fields';
      this.modalType = 'error';
      this.showModal('messageModal');
      return;
    }

    if (!this.isEditMode) {
      if (!this.loginForm.password || !this.confirmPassword) {
        this.modalMessage = 'Please enter password';
        this.modalType = 'error';
        this.showModal('messageModal');
        return;
      }
      if (this.loginForm.password !== this.confirmPassword) {
        this.modalMessage = 'Passwords do not match';
        this.modalType = 'error';
        this.showModal('messageModal');
        return;
      }
    }

    if (this.isEditMode) {
      // Update existing
      const index = this.logins.findIndex(l => l.id === this.loginForm.id);
      if (index !== -1) {
        this.logins[index] = { ...this.loginForm };
        this.saveToLocalStorage();
        this.modalMessage = 'Login updated successfully';
        this.modalType = 'success';
        this.showModal('messageModal');
      }
    } else {
      // Add new
      this.loginForm.id = this.logins.length > 0 ? Math.max(...this.logins.map(l => l.id)) + 1 : 1;
      this.logins.push({ ...this.loginForm });
      this.saveToLocalStorage();
      this.modalMessage = 'Login added successfully';
      this.modalType = 'success';
      this.showModal('messageModal');
    }

    this.searchLogins();
    this.closeDialog();
  }

  // Open delete confirmation modal
  confirmDelete(login: Login): void {
    this.deleteTarget = login;
    this.modalMessage = `Are you sure you want to delete ${login.name}?`;
    this.showModal('confirmModal');
  }

  // Execute delete after confirmation
  deleteLogin(): void {
    if (this.deleteTarget) {
      this.logins = this.logins.filter(l => l.id !== this.deleteTarget!.id);
      this.saveToLocalStorage();
      this.searchLogins();
      this.hideModal('confirmModal');
      
      this.modalMessage = 'Login deleted successfully';
      this.modalType = 'success';
      this.showModal('messageModal');
      
      this.deleteTarget = null;
    }
  }

  // Search
  searchLogins(): void {
    if (!this.searchTerm.trim()) {
      this.filteredLogins = [...this.logins];
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredLogins = this.logins.filter(login =>
      login.name.toLowerCase().includes(search) ||
      login.email.toLowerCase().includes(search) ||
      login.role.toLowerCase().includes(search) ||
      login.campus.toLowerCase().includes(search)
    );
  }

  // Pagination
  get paginatedLogins(): Login[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    return this.filteredLogins.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLogins.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
  