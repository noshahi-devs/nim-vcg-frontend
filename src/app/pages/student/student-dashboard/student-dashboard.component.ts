import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentDashboardService, StudentStats } from '../../../services/student-dashboard.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-student-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './student-dashboard.component.html',
    styleUrls: ['./student-dashboard.component.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StudentDashboardComponent implements OnInit {
    private dashboardService = inject(StudentDashboardService);
    private authService = inject(AuthService);

    stats: StudentStats | null = null;
    loading = true;
    error: string | null = null;

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user && user.studentId) {
            this.loadStats(user.studentId);
        } else {
            this.error = "Student ID not found for this user.";
            this.loading = false;
        }
    }

    loadStats(studentId: number): void {
        this.dashboardService.getStudentStats(studentId).subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching student stats:', err);
                this.error = "Failed to load dashboard data.";
                this.loading = false;
            }
        });
    }
}
