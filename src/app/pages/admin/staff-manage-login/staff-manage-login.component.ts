import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserManagementService, User } from '../../../services/user-management.service';
import Swal from '../../../swal';

interface Login {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  phone: string;
  status: string;
  createdOn: string;
}

@Component({
  selector: 'app-staff-manage-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-manage-login.component.html',
  styleUrls: ['./staff-manage-login.component.css']
})
export class StaffManageLoginComponent implements OnInit {
  title = 'Manage Logins';
  Math = Math;

  // Data
  logins: Login[] = [];
  filteredLogins: Login[] = [];

  // Dialog
  showDialog: boolean = false;
  isEditMode: boolean = false;

  // Premium Modal States
  showDeleteModal = false;
  showFeedbackModal = false;
  showStatusModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  deleteTarget: Login | null = null;
  statusTarget: Login | null = null;
  pendingStatus = '';
  isSaving = false;

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

  // View Dialog
  showViewDialog = false;
  viewLogin: Login | null = null;

  // Search & Pagination
  searchTerm: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;

  loading = false;

  get totalLogins(): number { return this.logins.length; }
  get activeLogins(): number { return this.logins.filter(x => x.status?.toLowerCase() === 'active').length; }
  get inactiveLogins(): number { return this.logins.filter(x => x.status?.toLowerCase() === 'inactive').length; }

  constructor(private userService: UserManagementService, private router: Router) { }

  ngOnInit(): void { this.loadStaffData(); }

  // ── Feedback Modal ──
  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string, autoClose = false) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
    if (autoClose) {
      setTimeout(() => { this.showFeedbackModal = false; }, 2200);
    }
  }
  closeFeedback() { this.showFeedbackModal = false; }

  loadStaffData(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.logins = users.map(u => ({
          id: u.id,
          name: u.userName,
          email: u.email,
          role: Array.isArray(u.role) ? u.role.join(', ') : (u.role || 'Teacher'),
          phone: u.phoneNumber || 'N/A',
          status: u.status || 'Active',
          createdOn: u.createdOn || new Date().toISOString().split('T')[0]
        }));
        this.filteredLogins = [...this.logins];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.showFeedback('error', 'Load Failed', 'Failed to load users. Please try again.');
        this.loading = false;
        this.logins = [];
        this.filteredLogins = [];
      }
    });
  }

  getEmptyForm(): Login {
    return { id: '0', name: '', email: '', password: '', role: '', phone: '', status: 'Active', createdOn: new Date().toISOString().split('T')[0] };
  }

  openAddDialog(): void { this.router.navigate(['/staff-add']); }

  openViewDialog(login: Login): void {
    this.viewLogin = { ...login };
    this.showViewDialog = true;
  }
  closeViewDialog(): void {
    this.showViewDialog = false;
    this.viewLogin = null;
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

  // ── Toggle Status with Premium Modal ──
  toggleStatus(login: Login): void {
    const newStatus = login.status?.toLowerCase() === 'active' ? 'Inactive' : 'Active';
    this.statusTarget = login;
    this.pendingStatus = newStatus;
    this.showStatusModal = true;
  }

  confirmToggleStatus(): void {
    if (!this.statusTarget) return;
    const login = this.statusTarget;
    const newStatus = this.pendingStatus;
    const action = newStatus === 'Active' ? 'Activated' : 'Deactivated';
    this.showStatusModal = false;

    this.userService.toggleUserStatus(login.id, newStatus).subscribe({
      next: () => {
        login.status = newStatus;
        this.showFeedback('success', `${action}!`, `${login.name} has been ${action.toLowerCase()} successfully.`, true);
        this.statusTarget = null;
      },
      error: (err) => {
        console.error('Error toggling status:', err);
        this.showFeedback('error', 'Action Failed', 'Failed to update user status. Please try again.');
        this.statusTarget = null;
      }
    });
  }

  cancelToggleStatus(): void {
    this.showStatusModal = false;
    this.statusTarget = null;
  }

  // ── CRUD ──
  saveLogin(): void {
    if (!this.loginForm.name || !this.loginForm.email || !this.loginForm.role || !this.loginForm.phone) {
      this.showFeedback('warning', 'Incomplete Form', 'Please fill all required fields before saving.');
      return;
    }

    if (!this.isEditMode) {
      if (!this.loginForm.password || !this.confirmPassword) {
        this.showFeedback('warning', 'Missing Password', 'Please enter and confirm the password.');
        return;
      }
      if (this.loginForm.password !== this.confirmPassword) {
        this.showFeedback('error', 'Password Mismatch', 'The passwords you entered do not match. Please try again.');
        return;
      }

      const registerData = {
        Username: this.loginForm.name,
        Email: this.loginForm.email,
        Password: this.loginForm.password,
        Role: [this.loginForm.role]
      };

      this.isSaving = true;
      this.userService.registerUser(registerData).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeDialog();
          this.showFeedback('success', 'Login Created!', `Account for ${this.loginForm.name || 'the user'} was created successfully.`, true);
          this.loadStaffData();
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Error creating user:', err);
          this.showFeedback('error', 'Creation Failed', err.error?.message || 'Failed to create the user account. Please try again.');
        }
      });
    } else {
      this.closeDialog();
      this.showFeedback('warning', 'Not Supported', 'User editing is not yet implemented. Please use the Staff Edit Profile page.');
    }
  }

  // ── Delete with Premium Modal ──
  confirmDelete(login: Login): void {
    this.deleteTarget = login;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
    this.showDeleteModal = false;
  }

  executeDelete(): void {
    if (!this.deleteTarget) return;
    const login = this.deleteTarget;
    this.showDeleteModal = false;

    this.userService.deleteUser(login.id).subscribe({
      next: () => {
        this.deleteTarget = null;
        this.showFeedback('success', 'Deleted!', `Login account for "${login.name}" has been permanently deleted.`, true);
        this.loadStaffData();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        const errorMsg = err.error?.message || 'This staff account cannot be deleted because it may have linked data (such as assigned subjects, classes, or student records). To maintain data integrity, please remove these links before deleting the account.';
        this.deleteTarget = null;
        this.showFeedback('error', 'Cannot Delete', errorMsg);
      }
    });
  }

  // ── Search & Pagination ──
  searchLogins(): void {
    if (!this.searchTerm.trim()) {
      this.filteredLogins = [...this.logins];
      this.currentPage = 1;
      return;
    }
    const search = this.searchTerm.toLowerCase();
    this.filteredLogins = this.logins.filter(login =>
      login.name.toLowerCase().includes(search) ||
      login.email.toLowerCase().includes(search) ||
      login.role.toLowerCase().includes(search)
    );
    this.currentPage = 1;
  }

  get paginatedLogins(): Login[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredLogins.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.filteredLogins.length / this.rowsPerPage); }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
