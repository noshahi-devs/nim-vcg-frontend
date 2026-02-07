import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../services/role.service';
import { StaffService } from '../../../services/staff.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { Staff, Designation } from '../../../Models/staff';
import { Role } from '../../../Models/role';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-assign-role',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, FormsModule, BreadcrumbComponent],
    providers: [RoleService, StaffService],
    templateUrl: './assign-role.component.html',
    styles: [`
    :host { display: block; }
  `]
})
export class AssignRoleComponent implements OnInit {
    title = 'Assign Role';
    staffList: Staff[] = [];
    roles: Role[] = [];

    selectedStaffId: string = '';
    selectedRole: string = '';
    Designation = Designation;

    constructor(
        private roleService: RoleService,
        private staffService: StaffService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        // Load Roles
        this.roleService.getAllRoles().subscribe({
            next: (res) => this.roles = res,
            error: () => {
                // Dummy Data
                this.roles = [
                    { id: '1', name: 'Admin' },
                    { id: '2', name: 'Principal' },
                    { id: '3', name: 'Teacher' }
                ];
            }
        });

        // Load Staff (as Users)
        this.staffService.getAllStaffs().subscribe({
            next: (res) => this.staffList = res,
            error: () => {
                // Dummy Data if Staff service fails or empty
                this.staffList = [
                    { staffId: 1, staffName: 'John Doe', designation: Designation.Instructor } as Staff,
                    { staffId: 2, staffName: 'Jane Smith', designation: Designation.Lecturer } as Staff
                ];
            }
        });
    }

    assign(): void {
        if (!this.selectedStaffId || !this.selectedRole) return;

        Swal.fire({
            title: 'Assigning Role...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        this.roleService.assignRole(this.selectedStaffId, [this.selectedRole]).subscribe({
            next: (res) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Role Assigned!',
                    text: `Role ${this.selectedRole} assigned successfully.`,
                    timer: 1500,
                    showConfirmButton: false
                });
            },
            error: (err) => {
                console.error('Role assignment error:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to assign role. ' + (err.error?.message || 'Please try again.')
                });
            }
        });
    }
}
