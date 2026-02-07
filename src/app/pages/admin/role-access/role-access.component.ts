import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../Models/role';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-role-access',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './role-access.component.html',
    styles: [`
    :host { display: block; }
  `]
})
export class RoleAccessComponent implements OnInit {
    roles: Role[] = [];
    newRoleName: string = '';
    isLoading: boolean = false;

    // Permissions Mock (Static for now, dynamic if backend supports Permission management)
    availablePermissions: string[] = [
        'User.Create', 'User.Edit', 'User.Delete',
        'Student.View', 'Student.Edit',
        'Fee.Manage', 'Report.View'
    ];

    constructor(private roleService: RoleService) { }

    ngOnInit(): void {
        this.loadRoles();
    }

    loadRoles(): void {
        this.isLoading = true;
        this.roleService.getAllRoles().subscribe({
            next: (data) => {
                // Fallback for demo if API fails empty
                if (!data || data.length === 0) {
                    this.roles = [
                        { id: '1', name: 'Admin', description: 'Full Access', permissions: this.availablePermissions },
                        { id: '2', name: 'Principal', description: 'School Management', permissions: ['Student.View', 'Report.View'] },
                        { id: '3', name: 'Teacher', description: 'Class Management', permissions: ['Student.View'] },
                        { id: '4', name: 'Accountant', description: 'Financial Management', permissions: ['Fee.Manage'] }
                    ];
                } else {
                    this.roles = data;
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load roles', err);
                // Fallback
                this.roles = [
                    { id: '1', name: 'Admin', description: 'Full Access', permissions: this.availablePermissions },
                    { id: '2', name: 'Principal', description: 'School Management', permissions: ['Student.View', 'Report.View'] },
                    { id: '3', name: 'Teacher', description: 'Class Management', permissions: ['Student.View'] },
                    { id: '4', name: 'Accountant', description: 'Financial Management', permissions: ['Fee.Manage'] }
                ];
                this.isLoading = false;
            }
        });
    }

    addRole(): void {
        if (!this.newRoleName.trim()) return;

        const newRole: Role = {
            id: '', // Backend gen
            name: this.newRoleName,
            description: 'Custom Role',
            permissions: []
        };

        this.roleService.createRole(newRole).subscribe({
            next: (res) => {
                this.loadRoles();
                this.newRoleName = '';
            },
            error: () => alert('Failed to create role (Simulated)')
        });
    }

    deleteRole(id: string): void {
        if (confirm('Are you sure?')) {
            this.roleService.deleteRole(id).subscribe({
                next: () => this.loadRoles(),
                error: () => alert('Failed to delete role (Simulated)')
            });
        }
    }
}
