import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../Models/role';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from '../../../swal';

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

        Swal.fire({
            title: 'Creating Role...',
            text: 'Please wait while we process the request.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        this.roleService.createRole(newRole).subscribe({
            next: (res) => {
                Swal.close();
                Swal.fire({ icon: 'success', title: 'Success', text: 'Role created successfully', timer: 1500, showConfirmButton: false });
                this.loadRoles();
                this.newRoleName = '';
            },
            error: () => {
                Swal.close();
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create role' });
            }
        });
    }

    deleteRole(id: string): void {
        Swal.fire({
            title: 'Delete Role?',
            text: 'Are you sure you want to delete this role?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancel'
        }).then(result => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                this.roleService.deleteRole(id).subscribe({
                    next: () => {
                        Swal.close();
                        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
                        this.loadRoles();
                    },
                    error: () => {
                        Swal.close();
                        Swal.fire('Error', 'Failed to delete role', 'error');
                    }
                });
            }
        });
    }
}
