import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../Models/role';
import { FormsModule } from '@angular/forms';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-role-access',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, FormsModule, BreadcrumbComponent],
    templateUrl: './role-access.component.html',
    styleUrl: './role-access.component.css'
})
export class RoleAccessComponent implements OnInit {
    roles: Role[] = [];
    newRoleName: string = '';
    isLoading: boolean = false;
    isSaving: boolean = false;

    // Defined System Permissions
    availablePermissions: string[] = [
        'View Dashboard', 'Manage Students', 'Manage Teachers', 'Manage Settings',
        'Manage Finance', 'Manage Attendance', 'Manage Exams', 'Manage Inventory'
    ];
    
    // Track selected permissions for the new role
    selectedPermissions: Set<string> = new Set();

    // Premium UI State
    showFeedbackModal = false;
    showDeleteConfirmModal = false;
    idToDelete: string | null = null;
    feedbackType: 'success' | 'error' | 'warning' = 'success';
    feedbackTitle = '';
    feedbackMessage = '';

    constructor(private roleService: RoleService) { }

    ngOnInit(): void {
        this.loadRoles();
    }

    loadRoles(): void {
        this.isLoading = true;
        this.roleService.getAllRoles().subscribe({
            next: (data) => {
                this.roles = data || [];
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load roles', err);
                this.roles = [];
                this.isLoading = false;
            }
        });
    }

    addRole(): void {
        if (!this.newRoleName.trim()) {
            this.showFeedback('warning', 'Role Name Required', 'Please enter a name for the new role (e.g., Editor).');
            return;
        }

        const newRole: Role = {
            id: '', // Backend gen
            name: this.newRoleName,
            description: 'Custom Role',
            permissions: Array.from(this.selectedPermissions)
        };

        this.isSaving = true;

        this.roleService.createRole(newRole).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.showFeedback('success', 'Role Created', `The role <b>${this.newRoleName}</b> was successfully created.`);
                this.loadRoles();
                this.newRoleName = '';
                this.selectedPermissions.clear(); // Reset selection
            },
            error: () => {
                this.isSaving = false;
                this.showFeedback('error', 'Creation Failed', 'Failed to create the new role.');
            }
        });
    }

    deleteRole(id: string): void {
        this.idToDelete = id;
        this.showDeleteConfirmModal = true;
    }

    cancelDelete() {
        this.showDeleteConfirmModal = false;
        this.idToDelete = null;
    }

    togglePermission(permission: string) {
        if (this.selectedPermissions.has(permission)) {
            this.selectedPermissions.delete(permission);
        } else {
            this.selectedPermissions.add(permission);
        }
    }

    confirmDeleteRole() {
        if (!this.idToDelete) return;

        this.isSaving = true;
        this.showDeleteConfirmModal = false;

        this.roleService.deleteRole(this.idToDelete).subscribe({
            next: () => {
                this.isSaving = false;
                this.idToDelete = null;
                this.showFeedback('success', 'Role Deleted', 'The role has been removed successfully.');
                this.loadRoles();
            },
            error: () => {
                this.isSaving = false;
                this.idToDelete = null;
                this.showFeedback('error', 'Deletion Failed', 'Failed to delete the role.');
            }
        });
    }

    showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
        this.feedbackType = type;
        this.feedbackTitle = title;
        this.feedbackMessage = message;
        this.showFeedbackModal = true;
    }

    closeFeedback() {
        this.showFeedbackModal = false;
    }
}
