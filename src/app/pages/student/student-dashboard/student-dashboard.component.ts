import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentDashboardService, StudentStats } from '../../../services/student-dashboard.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-student-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './student-dashboard.component.html',
    styleUrl: './student-dashboard.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
    stats: StudentStats | null = null;
    loading = true;
    error: string | null = null;

    // Time & Greeting
    greeting = '';
    currentTime = '';
    currentDate = '';
    private timeInterval: any;

    constructor(
        private studentDashboardService: StudentDashboardService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user) {
            const studentId = user.studentId || Number(user.id);
            if (!isNaN(studentId)) {
                this.loadDashboardStats(studentId);
            } else {
                this.error = 'Invalid Student ID.';
                this.loading = false;
            }
        } else {
            this.error = 'User not found. Please log in again.';
            this.loading = false;
        }

        this.updateTime();
        this.timeInterval = setInterval(() => this.updateTime(), 1000);
    }

    updateTime(): void {
        const now = new Date();
        const h = now.getHours();
        this.greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
        this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    loadDashboardStats(studentId: number): void {
        this.studentDashboardService.getStudentStats(studentId).subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching dashboard stats:', err);
                this.error = 'Failed to load dashboard data. Please try again later.';
                this.loading = false;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }
}
