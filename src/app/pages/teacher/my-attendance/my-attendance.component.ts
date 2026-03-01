import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AttendanceService } from '../../../services/attendance.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
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
    checkedOut = false;
    userId: string | null = null;
    userName: string | null = null;
    staffId: number | null = null;
    history: any[] = [];

    constructor(
        private authService: AuthService,
        private attendanceService: AttendanceService,
        private staffService: StaffService
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user && user.email) {
            this.userId = (user as any).id || (user as any).userId;
            this.userName = (user as any).username;

            this.staffService.getAllStaffs().subscribe({
                next: (staffs) => {
                    const staff = staffs.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
                    if (staff) {
                        this.staffId = staff.staffId;
                        this.loadHistory();
                    } else {
                        Swal.fire('Warning', 'Staff profile could not be found for this user.', 'warning');
                        this.loadHistory(); // Still try to load if there's old data, though unlikely
                    }
                },
                error: (err) => {
                    console.error('Failed to load staff details', err);
                    this.loadHistory();
                }
            });
        }
    }

    loadHistory() {
        this.attendanceService.getAttendances().subscribe({
            next: (data) => {
                // Filter records for this user (Today and history)
                // Note: The API currently returns ALL records. We filter by ID.
                const searchId = this.staffId ? this.staffId.toString() : this.userId?.toString();
                this.history = data.filter(a => {
                    const isUserMatch = a.attendanceIdentificationNumber?.toString() === searchId;
                    const isStaffType = a.type == 1 || a.type as any === 'Staff';
                    return isUserMatch && isStaffType;
                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                // Safely check for local date, considering potential UTC drift from the server
                this.alreadyMarked = false;
                this.checkedOut = false;

                for (const a of this.history) {
                    const recordDate = new Date(a.date);
                    // Strictly match year, month, and day to avoid previous day's late checks overlapping
                    if (recordDate.getFullYear() === this.today.getFullYear() &&
                        recordDate.getMonth() === this.today.getMonth() &&
                        recordDate.getDate() === this.today.getDate()) {
                        this.alreadyMarked = true;
                        if (a.checkOutTime) {
                            this.checkedOut = true;
                        }
                        break; // Found today's record
                    }
                }
            }
        });
    }

    markAttendance() {
        if (!this.staffId) {
            Swal.fire('Error', 'Staff profile not found. Cannot mark attendance.', 'error');
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
                    date: this.getLocalIsoString(new Date()),
                    type: 1, // Staff
                    attendanceIdentificationNumber: this.staffId,
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

    markCheckOut() {
        if (!this.staffId) {
            Swal.fire('Error', 'Staff profile not found. Cannot mark check-out.', 'error');
            return;
        }

        Swal.fire({
            title: 'Confirm Check-Out',
            text: `Are you sure you want to clock out for today?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Check Out',
            confirmButtonColor: '#ff5b5b'
        }).then((result) => {
            if (result.isConfirmed) {
                const payload = {
                    attendanceId: 0,
                    date: this.getLocalIsoString(new Date()),
                    type: 1, // Staff
                    attendanceIdentificationNumber: this.staffId,
                    isPresent: true,
                    description: 'Self Checked Out'
                };

                this.attendanceService.checkOutStaff(payload as any).subscribe({
                    next: () => {
                        Swal.fire('Checked Out!', 'Your check-out time has been recorded.', 'success');
                        this.loadHistory();
                    },
                    error: (err) => {
                        console.error(err);
                        Swal.fire('Error', err?.error || 'Database rejected check-out. Please contact admin.', 'error');
                    }
                });
            }
        });
    }

    calculateHours(checkIn: Date | string, checkOut: Date | string | undefined): string {
        if (!checkIn || !checkOut) return '--';
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();
        const diffHours = (end - start) / (1000 * 60 * 60);

        if (diffHours < 0) return '--';

        const hours = Math.floor(diffHours);
        const minutes = Math.floor((diffHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    }

    private getLocalIsoString(date: Date): string {
        const tzo = -date.getTimezoneOffset();
        const dif = tzo >= 0 ? '+' : '-';
        const pad = (num: number) => {
            const norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds());
    }
}
