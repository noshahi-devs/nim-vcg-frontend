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
import Swal from '../../../swal';

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
    roles: Role[] = [];

    selectedStaffId: string = '';
    selectedRole: string = '';
    Designation = Designation;

    constructor(
        private roleService: RoleService,
        private staffService: StaffService,
        private userService: UserManagementService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        // Load Roles
        this.roleService.getAllRoles().subscribe({
            next: (res) => this.roles = res,
            error: () => {
                this.roles = [
                    { id: '1', name: 'Admin' },
                    { id: '2', name: 'Principal' },
                    { id: '3', name: 'Teacher' }
                ];
            }
        });

        // Load Staff and Users to match them
        
        forkJoin({
            staff: this.staffService.getAllStaffs(),
            users: this.userService.getAllUsers()
        }).subscribe({
            next: (data) => {
                this.staffList = data.staff.map(s => {
                    const matchedUser = data.users.find(u => u.email?.toLowerCase() === s.email?.toLowerCase());
                    return {
                        ...s,
                        userId: matchedUser?.id
                    };
                }).filter(s => !!s.userId); // Only show staff who have user accounts
            },
            error: (err) => {
                console.error('Error loading data:', err);
                // Fallback dummy data if needed
                this.staffList = [
                    { staffId: 1, staffName: 'John Doe', designation: Designation.Teacher, email: 'john@test.com', userId: 'dummy-id-1' } as any
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


