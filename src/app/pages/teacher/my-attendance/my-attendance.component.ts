import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AttendanceService } from '../../../services/attendance.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-my-attendance',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, BreadcrumbComponent],
    templateUrl: './my-attendance.component.html',
    styleUrls: ['./my-attendance.component.css']
})
export class MyAttendanceComponent implements OnInit {
    title = 'My Attendance';
    today = new Date();
    alreadyMarked = false;
    userId: string | null = null;
    userName: string | null = null;
    history: any[] = [];

    constructor(
        private authService: AuthService,
        private attendanceService: AttendanceService
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user) {
            this.userId = (user as any).id || (user as any).userId;
            this.userName = (user as any).username;
            this.loadHistory();
        }
    }

    loadHistory() {
        this.attendanceService.getAttendances().subscribe({
            next: (data) => {
                // Filter records for this user (Today and history)
                // Note: The API currently returns ALL records. We filter by ID.
                this.history = data.filter(a => a.attendanceIdentificationNumber.toString() === this.userId?.toString())
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const todayStr = this.today.toISOString().split('T')[0];
                this.alreadyMarked = this.history.some(a => a.date.toString().startsWith(todayStr));
            }
        });
    }

    markAttendance() {
        if (!this.userId) {
            Swal.fire('Error', 'User profile not loaded correctly.', 'error');
            return;
        }

        Swal.fire({
            title: 'Confirm Check-In',
            text: `Record your presence for today, ${this.today.toLocaleDateString()}?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Yes, Confirm',
            confirmButtonColor: '#6366f1'
        }).then((result) => {
            if (result.isConfirmed) {
                const payload = {
                    attendanceId: 0,
                    date: new Date(),
                    type: 1, // Staff
                    attendanceIdentificationNumber: parseInt(this.userId || '0'), // Assuming numeric ID for now, see fix below
                    isPresent: true,
                    description: 'Self Marked'
                };

                this.attendanceService.addAttendance(payload as any).subscribe({
                    next: () => {
                        Swal.fire('Checked In!', 'Your attendance has been recorded.', 'success');
                        this.loadHistory();
                    },
                    error: (err) => {
                        console.error(err);
                        Swal.fire('Error', 'Database rejected attendance. Please contact admin.', 'error');
                    }
                });
            }
        });
    }
}
