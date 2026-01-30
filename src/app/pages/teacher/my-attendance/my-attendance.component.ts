import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AttendanceService } from '../../../services/attendance.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-my-attendance',
    standalone: true,
    imports: [CommonModule, BreadcrumbComponent],
    template: `
    <div class="dashboard-main-body">
    <app-breadcrumb [title]="title"></app-breadcrumb>

    <div class="row gy-4">
    <!-- Check In Card -->
    <div class="col-xxl-6 col-md-6">
      <div class="card h-100 radius-12 p-24 text-center">
        <h6 class="mb-12">Mark Attendance</h6>
        <p class="text-secondary-light mb-24">Date: {{ today | date:'mediumDate' }}</p>

        <div *ngIf="alreadyMarked; else markBtn">
            <span class="badge bg-success-600 text-white text-lg px-24 py-12 radius-8">
                <i class="ri-check-line"></i> Attendance Marked
            </span>
        </div>

        <ng-template #markBtn>
            <button (click)="markAttendance()" 
                    class="btn btn-primary-600 radius-8 px-32 py-12 d-inline-flex align-items-center gap-2">
                <i class="ri-fingerprint-line text-xl"></i> 
                Check In Now
            </button>
        </ng-template>

      </div>
    </div>
    </div>
  `,
    styles: []
})
export class MyAttendanceComponent implements OnInit {
    title = 'My Attendance';
    today = new Date();
    alreadyMarked = false;
    userId: string | null = null;
    userName: string | null = null;

    constructor(
        private authService: AuthService,
        private attendanceService: AttendanceService
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user) {
            // Assuming AuthResponse has id or similar. 
            // Based on previous AuthService view, it stores whatever API returns.
            // We will need to map this correctly. If user.id doesn't exist, we might need to rely on email or specific claim.
            // For now, I will assume user.id or user.userId exists. 
            // If strict typing issues arise, I will fix.
            this.userId = (user as any).id || (user as any).userId;
            this.userName = (user as any).username;
        }
    }

    markAttendance() {
        if (!this.userId) {
            Swal.fire('Error', 'User ID not found. Please relogin.', 'error');
            return;
        }

        Swal.fire({
            title: 'Mark Attendance?',
            text: `Mark present for ${this.today.toLocaleDateString()}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Check In'
        }).then((result) => {
            if (result.isConfirmed) {

                // Prepare payload
                const payload = {
                    attendanceId: 0,
                    date: new Date(),
                    type: 1, // Staff type
                    attendanceIdentificationNumber: this.userId, // Sending User ID as identification
                    staffId: this.userId, // Sending User ID as staffId
                    isPresent: true,
                    description: 'Self Marked by ' + this.userName
                };

                this.attendanceService.addAttendance(payload as any).subscribe({
                    next: () => {
                        this.alreadyMarked = true;
                        Swal.fire('Success', 'Attendance marked successfully!', 'success');
                    },
                    error: (err) => {
                        console.error(err);
                        Swal.fire('Error', 'Failed to mark attendance.', 'error');
                    }
                });
            }
        });
    }
}
