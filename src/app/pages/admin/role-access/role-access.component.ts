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
    styleUrl: './role-access.component.css'
})
export class RoleAccessComponent implements OnInit {
    roles: Role[] = [];
    newRoleName: string = '';
    isLoading: boolean = false;

    availablePermissions: string[] = [];

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
