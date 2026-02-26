import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { UserManagementService, User } from '../../../services/user-management.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

interface Login {
  id: string;
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

  loading = false;

  constructor(private userService: UserManagementService, private router: Router) { }

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
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.logins = users.map(u => ({
          id: u.id,
          name: u.userName,
          email: u.email,
          role: Array.isArray(u.role) ? u.role.join(', ') : (u.role || 'Teacher'),
          campus: u.campus || 'Main Campus',
          phone: u.phoneNumber || 'N/A',
          status: u.status || 'Active',
          createdOn: u.createdOn || new Date().toISOString().split('T')[0]
        }));
        this.filteredLogins = [...this.logins];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load users' });
        this.loading = false;
        // Fallback to empty array
        this.logins = [];
        this.filteredLogins = [];
      }
    });
  }

  getEmptyForm(): Login {
    return {
      id: '0',
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
    this.router.navigate(['/sign-up']);
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
      Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please fill all required fields' });
      return;
    }

    if (!this.isEditMode) {
      if (!this.loginForm.password || !this.confirmPassword) {
        Swal.fire({ icon: 'warning', title: 'Missing Password', text: 'Please enter password' });
        return;
      }
      if (this.loginForm.password !== this.confirmPassword) {
        Swal.fire({ icon: 'error', title: 'Mismatch', text: 'Passwords do not match' });
        return;
      }

      // Create new user
      const registerData = {
        Username: this.loginForm.name,
        Email: this.loginForm.email,
        Password: this.loginForm.password,
        Role: [this.loginForm.role] // Backend expects array
      };

      this.userService.registerUser(registerData).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Created!', text: 'User created successfully', timer: 1500, showConfirmButton: false });
          this.loadStaffData();
          this.closeDialog();
        },
        error: (err) => {
          console.error('Error creating user:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to create user' });
        }
      });
    } else {
      // For edit mode, we might need to call a different endpoint
      // For now, just show a message that edit is not supported via this interface
      Swal.fire({ icon: 'info', title: 'Not Supported', text: 'User editing is not yet implemented' });
      this.closeDialog();
    }
  }

  // Open delete confirmation modal
  confirmDelete(login: Login): void {
    Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${login.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteLogin(login.id);
      }
    });
  }

  // Execute delete
  deleteLogin(userId: string): void {
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        this.loadStaffData();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete user' });
      }
    });
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
