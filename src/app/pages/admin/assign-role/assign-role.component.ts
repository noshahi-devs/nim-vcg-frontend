import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RoleService } from '../../../services/role.service';
import { StaffService } from '../../../services/staff.service';
import { UserManagementService, User } from '../../../services/user-management.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { Staff, Designation } from '../../../Models/staff';
import { Role } from '../../../Models/role';

@Component({
    selector: 'app-assign-role',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, FormsModule, BreadcrumbComponent],
    providers: [RoleService, StaffService, UserManagementService],
    templateUrl: './assign-role.component.html',
    styleUrls: ['./assign-role.component.css']
})
export class AssignRoleComponent implements OnInit {
    title = 'Assign Role';
    staffList: (Staff & { userId?: string })[] = [];
    allUsers: User[] = [];
    roles: Role[] = [];

    selectedStaffId: string = '';
    selectedRole: string = '';
    Designation = Designation;
    isSaving = false;

    // ── Premium Modal State ──
    showConfirmModal = false;
    showFeedbackModal = false;
    feedbackType: 'success' | 'error' | 'warning' = 'success';
    feedbackTitle = '';
    feedbackMessage = '';

    constructor(
        private roleService: RoleService,
        private staffService: StaffService,
        private userService: UserManagementService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.roleService.getAllRoles().subscribe({
            next: (res) => this.roles = res,
            error: () => {
                this.roles = [
                    { id: '1', name: 'Admin' },
                    { id: '2', name: 'Principal' },
                    { id: '3', name: 'Teacher' },
                    { id: '4', name: 'Accountant' }
                ];
            }
        });

        forkJoin({
            staff: this.staffService.getAllStaffs(),
            users: this.userService.getAllUsers()
        }).subscribe({
            next: (data) => {
                this.allUsers = data.users;
                this.staffList = data.staff.map(s => {
                    const matchedUser = data.users.find(u => u.email?.toLowerCase() === s.email?.toLowerCase());
                    return { ...s, userId: matchedUser?.id };
                }).filter(s => !!s.userId);
            },
            error: (err) => {
                console.error('Error loading data:', err);
                this.staffList = [];
            }
        });
    }

    // ── Helpers ──
    getSelectedStaffName(): string {
        return this.staffList.find(s => s.userId === this.selectedStaffId)?.staffName || '';
    }

    // ── Modal Controls ──
    openConfirmModal(): void {
        if (!this.selectedStaffId || !this.selectedRole) return;

        // Principal duplicate check — show warning modal instead of confirming
        if (this.selectedRole === 'Principal') {
            const existing = this.allUsers.find(u => {
                const roles = Array.isArray(u.role) ? u.role : [u.role];
                const isActive = (u.status || 'active').toLowerCase() === 'active';
                return isActive && roles.some((r: string) => r?.toLowerCase() === 'principal');
            });
            if (existing) {
                this.showFeedback(
                    'warning',
                    'Principal Already Active!',
                    `<b>${existing.userName || existing.email}</b> is already an active <b>Principal</b>.<br>
                     Please deactivate the current Principal before assigning a new one.`
                );
                return;
            }
        }

        this.showConfirmModal = true;
    }

    closeConfirmModal(): void {
        this.showConfirmModal = false;
    }

    showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string): void {
        this.feedbackType = type;
        this.feedbackTitle = title;
        this.feedbackMessage = message;
        this.showFeedbackModal = true;
    }

    closeFeedback(): void {
        this.showFeedbackModal = false;
    }

    // ── Actual Assignment ──
    confirmAssign(): void {
        this.isSaving = true;

        this.roleService.assignRole(this.selectedStaffId, [this.selectedRole]).subscribe({
            next: () => {
                this.isSaving = false;
                this.showConfirmModal = false;
                this.showFeedback(
                    'success',
                    'Role Assigned!',
                    `<b>${this.getSelectedStaffName()}</b> has been successfully assigned the <b>${this.selectedRole}</b> role.`
                );
                // Reset form
                this.selectedStaffId = '';
                this.selectedRole = '';
                this.loadData();
            },
            error: (err) => {
                this.isSaving = false;
                this.showConfirmModal = false;
                console.error('Role assignment error:', err);
                this.showFeedback(
                    'error',
                    'Assignment Failed',
                    err.error?.message || 'Failed to assign the role. Please try again.'
                );
            }
        });
    }
}
