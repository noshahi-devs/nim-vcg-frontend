import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-student-attendance-view',
    standalone: true,
    imports: [CommonModule, BreadcrumbComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './student-attendance-view.component.html',
    styleUrl: './student-attendance-view.component.css'
})
export class StudentAttendanceViewComponent implements OnInit {
    attendanceHistory: any[] = [];
    loading = true;
    error: string | null = null;

    // Stats
    totalDays = 0;
    presentDays = 0;
    absentDays = 0;
    attendancePercentage = 0;

    // Calendar Logic
    currentDate = new Date();
    calendarDays: any[] = [];
    monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    constructor(
        private attendanceService: AttendanceService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user) {
            const studentId = user.studentId || Number(user.id);
            this.loadAttendance(studentId);
        } else {
            this.error = "User not found.";
            this.loading = false;
        }
    }

    loadAttendance(studentId: number): void {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90); // Last 90 days
        const startDateStr = startDate.toISOString().split('T')[0];

        this.attendanceService.getStudentAttendanceReport(studentId, startDateStr, endDate).subscribe({
            next: (data) => {
                this.attendanceHistory = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                this.calculateStats();
                this.generateCalendar();
                this.loading = false;
            },
            error: (err) => {
                console.error("Error loading attendance:", err);
                this.error = "Failed to load attendance records.";
                this.loading = false;
            }
        });
    }

    calculateStats(): void {
        this.totalDays = this.attendanceHistory.length;
        this.presentDays = this.attendanceHistory.filter(a => a.isPresent || a.status === 'Present').length;
        this.absentDays = this.totalDays - this.presentDays;
        this.attendancePercentage = this.totalDays > 0 ? (this.presentDays / this.totalDays) * 100 : 0;
    }

    generateCalendar(): void {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        this.calendarDays = [];

        // Previous month padding
        for (let i = 0; i < firstDay; i++) {
            this.calendarDays.push({ day: null, status: null });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(year, month, d).toISOString().split('T')[0];
            const record = this.attendanceHistory.find(a => a.date.split('T')[0] === dateStr);

            this.calendarDays.push({
                day: d,
                status: record ? (record.isPresent || record.status === 'Present' ? 'present' : 'absent') : null,
                isToday: dateStr === new Date().toISOString().split('T')[0]
            });
        }
    }

    prevMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.generateCalendar();
    }

    nextMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.generateCalendar();
    }
}
