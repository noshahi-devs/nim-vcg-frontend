import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserManagementService, User } from '../../../services/user-management.service';
import { PopupService } from '../../../services/popup.service';

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

  constructor(private userService: UserManagementService, private router: Router, private popup: PopupService) { }

  ngOnInit(): void { this.loadStaffData(); }



  loadStaffData(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        console.warn("==== API RESPONSE (GetUsers) ====", users);
        this.logins = users.map(u => {
          const apiRole = u.role || (u as any).Role;
          const apiPhone = u.phoneNumber || (u as any).PhoneNumber;
          return {
          id: u.id,
          name: u.userName || (u as any).UserName,
          email: u.email || (u as any).Email,
          role: Array.isArray(apiRole) && apiRole.length > 0 ? apiRole.join(', ') : (typeof apiRole === 'string' && apiRole ? apiRole : 'Unassigned'),
          phone: apiPhone || 'Unassigned',
          status: u.status || 'Active',
          createdOn: u.createdOn || new Date().toISOString().split('T')[0]
          };
        });
        this.filteredLogins = [...this.logins];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.popup.error('Failed to load users. Please try again.', 'Load Failed');
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
    const action = newStatus === 'Active' ? 'Activate' : 'Deactivate';
    
    this.popup.confirm(
      `Confirm ${action}`, 
      `Are you sure you want to ${action.toLowerCase()} <strong>${login.name}</strong>?`,
      `Yes, ${action}`,
      'Cancel',
      'info'
    ).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Updating status...');
        this.userService.toggleUserStatus(login.id, newStatus).subscribe({
          next: () => {
            this.popup.closeLoading();
            login.status = newStatus;
            this.popup.success(`${action}d!`, `${login.name} has been ${action.toLowerCase()}d successfully.`);
          },
          error: (err) => {
            this.popup.closeLoading();
            console.error('Error toggling status:', err);
            this.popup.error('Action Failed', 'Failed to update user status.');
          }
        });
      }
    });
  }

  // ── CRUD ──
  saveLogin(): void {
    if (!this.loginForm.name || !this.loginForm.email || !this.loginForm.role) {
      this.popup.warning('Please fill all required fields before saving.', 'Incomplete Form');
      return;
    }

    if (!this.isEditMode) {
      if (!this.loginForm.password || !this.confirmPassword) {
        this.popup.warning('Please enter and confirm the password.', 'Missing Password');
        return;
      }
      if (this.loginForm.password !== this.confirmPassword) {
        this.popup.error('The passwords do not match.', 'Password Mismatch');
        return;
      }

      // ── VALIDATION: Only one active Principal allowed ──
      if (this.loginForm.role === 'Principal') {
        const existingPrincipal = this.logins.find(l =>
          l.role?.toLowerCase().includes('principal') &&
          l.status?.toLowerCase() === 'active'
        );
        if (existingPrincipal) {
          this.popup.warning(`"${existingPrincipal.name}" is already an active Principal. Please deactivate first.`, 'Principal Active');
          return;
        }
      }

      const registerData = {
        Username: this.loginForm.name,
        Email: this.loginForm.email,
        Password: this.loginForm.password,
        Role: [this.loginForm.role],
        PhoneNumber: this.loginForm.phone
      };

      console.warn("==== FRONTEND PAYLOAD BEING SENT TO BACKEND ====", registerData);

      this.isSaving = true;
      this.popup.loading('Creating account...');
      this.userService.registerUser(registerData).subscribe({
        next: () => {
          this.isSaving = false;
          this.popup.closeLoading();
          this.closeDialog();
          this.popup.success('Login Created!', 'Account created successfully.');
          this.loadStaffData();
        },
        error: (err) => {
          this.isSaving = false;
          this.popup.closeLoading();
          console.error('Error creating user:', err);
          this.popup.error('Creation Failed', err.error?.message || 'Failed to create the user account.');
        }
      });
    } else {
      this.closeDialog();
      this.popup.warning('User editing is not yet implemented. Please use Staff Edit Profile.', 'Not Supported');
    }
  }

  // ── Delete with Premium Modal ──
  confirmDelete(login: Login): void {
    this.popup.confirm(
      'Confirm Deletion',
      `Are you sure you want to delete the login for <strong>${login.name}</strong>?`,
      'Yes, Delete',
      'Cancel'
    ).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting account...');
        this.userService.deleteUser(login.id).subscribe({
          next: () => {
            this.popup.closeLoading();
            this.popup.deleted('Login Account');
            this.loadStaffData();
          },
          error: (err) => {
            this.popup.closeLoading();
            console.error('Error deleting user:', err);
            const errorMsg = err.error?.message || 'Could not delete staff. Ensure they do not have linked data.';
            this.popup.deleteError('Account', errorMsg);
          }
        });
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
