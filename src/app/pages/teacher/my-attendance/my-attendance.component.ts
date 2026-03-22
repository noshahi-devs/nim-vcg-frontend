import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AttendanceService } from '../../../services/attendance.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
import Swal from '../../../swal';

@Component({
    selector: 'app-my-attendance',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, BreadcrumbComponent, FormsModule],
    templateUrl: './my-attendance.component.html',
    styleUrls: ['./my-attendance.component.css']
})
export class MyAttendanceComponent implements OnInit {
    title = 'My Attendance';
    Math = Math;
    today = new Date();
    alreadyMarked = false;
    checkedOut = false;
    userId: string | null = null;
    userName: string | null = null;
    staffId: number | null = null;
    history: any[] = [];
    isProcessing = false;

    // Premium Modal States
    showFeedbackModal = false;
    feedbackType: 'success' | 'error' | 'warning' = 'success';
    feedbackTitle = '';
    feedbackMessage = '';
    onOkFeedback: (() => void) | null = null;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    pageSizeOptions = [5, 10, 15, 20, 50];
    totalPages = 1;
    paginatedHistory: any[] = [];

    // Confirmation Modal States
    showConfirmModal = false;
    confirmTitle = '';
    confirmMessage = '';
    confirmActionType: 'checkIn' | 'checkOut' = 'checkIn';

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
                        this.showFeedback('warning', 'Profile Warning', 'Staff profile could not be found for this user.');
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

                this.updatePagination();

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
            this.showFeedback('error', 'Profile Error', 'Staff profile not found. Cannot mark attendance.');
            return;
        }

        this.openConfirmModal(
            'checkIn',
            'Confirm Check-In',
            `Record your presence for today, ${this.today.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}?`
        );
    }

    processCheckIn() {
        this.isProcessing = true;
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
                this.isProcessing = false;
                this.showFeedback('success', 'Checked In!', 'Your attendance has been recorded.', () => {
                    this.loadHistory();
                });
            },
            error: (err) => {
                this.isProcessing = false;
                console.error(err);
                this.showFeedback('error', 'Error', 'Database rejected attendance. Please contact admin.');
            }
        });
    }

    markCheckOut() {
        if (!this.staffId) {
            this.showFeedback('error', 'Profile Error', 'Staff profile not found. Cannot mark check-out.');
            return;
        }

        this.openConfirmModal(
            'checkOut',
            'Confirm Check-Out',
            `Are you sure you want to clock out for today?`
        );
    }

    processCheckOut() {
        this.isProcessing = true;
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
                this.isProcessing = false;
                this.showFeedback('success', 'Checked Out!', 'Your check-out time has been recorded.', () => {
                    this.loadHistory();
                });
            },
            error: (err) => {
                this.isProcessing = false;
                console.error(err);
                this.showFeedback('error', 'Error', err?.error || 'Database rejected check-out. Please contact admin.');
            }
        });
    }

    // Removed Swals from here, logic transferred to processing functions.

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

    // Modal Helpers
    showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string, cb?: () => void) {
        this.feedbackType = type;
        this.feedbackTitle = title;
        this.feedbackMessage = message;
        this.showFeedbackModal = true;
        this.onOkFeedback = cb || null;
    }

    closeFeedback() {
        this.showFeedbackModal = false;
        if (this.onOkFeedback) {
            this.onOkFeedback();
            this.onOkFeedback = null;
        }
    }

    openConfirmModal(type: 'checkIn' | 'checkOut', title: string, message: string) {
        this.confirmActionType = type;
        this.confirmTitle = title;
        this.confirmMessage = message;
        this.showConfirmModal = true;
    }

    closeConfirmModal() {
        this.showConfirmModal = false;
    }

    confirmAction() {
        this.showConfirmModal = false;
        if (this.confirmActionType === 'checkIn') {
            this.processCheckIn();
        } else {
            this.processCheckOut();
        }
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.history.length / this.pageSize) || 1;
        const start = (this.currentPage - 1) * this.pageSize;
        this.paginatedHistory = this.history.slice(start, start + this.pageSize);
    }

    changePage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    onPageSizeChange() {
        this.currentPage = 1;
        this.updatePagination();
    }

    getPageNumbers(): number[] {
        const pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }
}


