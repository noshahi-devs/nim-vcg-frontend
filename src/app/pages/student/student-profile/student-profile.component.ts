import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../services/student.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { Student } from '../../../Models/student';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-student-profile',
    standalone: true,
    imports: [CommonModule, BreadcrumbComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './student-profile.component.html',
    styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit {
    studentData: Student | null = null;
    loading = true;
    error: string | null = null;

    constructor(
        private studentService: StudentService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user) {
            const studentId = user.studentId || Number(user.id);
            if (!isNaN(studentId)) {
                this.loadProfile(studentId);
            } else {
                this.error = 'Invalid Student ID.';
                this.loading = false;
            }
        } else {
            this.error = 'User not found. Please log in again.';
            this.loading = false;
        }
    }

    loadProfile(studentId: number): void {
        this.studentService.GetStudent(studentId).subscribe({
            next: (data) => {
                this.studentData = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching student profile:', err);
                this.error = 'Failed to load profile details.';
                this.loading = false;
            }
        });
    }

    getStudentImage(): string {
        if (this.studentData?.imageUpload?.imageData) {
            return this.studentData.imageUpload.imageData;
        }
        return 'assets/images/user.png';
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }
}
