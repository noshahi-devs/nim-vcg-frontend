import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../services/student.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StudentDashboardService, StudentStats } from '../../../services/student-dashboard.service';
import { Student } from '../../../Models/student';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-student-profile',
    standalone: true,
    imports: [CommonModule, BreadcrumbComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './student-profile.component.html',
    styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit {
    private studentService = inject(StudentService);
    private authService = inject(AuthService);
    private dashboardService = inject(StudentDashboardService);

    studentData: Student | null = null;
    stats: StudentStats | null = null;
    attendanceHistory: any[] = [];
    
    activeTab: 'overview' | 'academic' | 'attendance' | 'finance' = 'overview';
    loading = true;
    error: string | null = null;

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user) {
            // Check for studentId (from login payload) or fallback to id
            const studentId = user.studentId || Number(user.id);
            if (!isNaN(studentId) && studentId > 0) {
                this.loadAllData(studentId);
            } else {
                this.error = 'Unable to identify Student ID. Please ensure your account is properly linked.';
                this.loading = false;
            }
        } else {
            this.error = 'User not found. Please log in again.';
            this.loading = false;
        }
    }

    loadAllData(studentId: number): void {
        this.loading = true;
        
        forkJoin({
            profile: this.studentService.GetStudent(studentId),
            stats: this.dashboardService.getStudentStats(studentId),
            attendance: this.dashboardService.getAttendanceHistory(studentId)
        }).subscribe({
            next: (data) => {
                this.studentData = data.profile;
                this.stats = data.stats;
                this.attendanceHistory = data.attendance;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching student dashboard data:', err);
                this.error = 'Failed to load some profile details. Please try again later.';
                this.loading = false;
            }
        });
    }

    getStudentImage(): string {
        if (this.studentData?.imageUpload?.imageData) {
            return this.studentData.imageUpload.imageData;
        }
        if (this.studentData?.imagePath) {
            return this.studentData.imagePath;
        }
        return 'assets/images/user.png';
    }

    getInitials(name: string | undefined): string {
        if (!name) return '?';
        return name.split(' ').filter(x => x.length > 0).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    getAttendanceStatusClass(isPresent: boolean): string {
        return isPresent ? 'status-present' : 'status-absent';
    }
}
