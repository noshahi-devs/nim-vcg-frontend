import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../SecurityModels/auth.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-student-fee-view',
    standalone: true,
    imports: [CommonModule, BreadcrumbComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './student-fee-view.component.html',
    styleUrl: './student-fee-view.component.css'
})
export class StudentFeeViewComponent implements OnInit {
    studentId: number | null = null;
    loading = true;
    stats: any = {
        totalPaid: 0,
        totalDue: 0,
        netPayable: 0
    };
    monthlyPayments: any[] = [];
    otherPayments: any[] = [];

    private apiUrl = `${environment.apiBaseUrl}/api`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const user = this.authService.userValue;
        if (user && user.studentId) {
            this.studentId = user.studentId;
            this.loadData();
        }
    }

    loadData(): void {
        if (!this.studentId) return;
        this.loading = true;

        // Fetch dashboard stats for totals
        this.http.get(`${this.apiUrl}/StudentDashboard/stats/${this.studentId}`).subscribe({
            next: (data: any) => {
                this.stats.totalPaid = data.totalPaid || 0;
                this.stats.totalDue = data.totalDue || 0;
                this.stats.netPayable = this.stats.totalPaid + this.stats.totalDue;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching fee stats', err);
                this.loading = false;
            }
        });

        // Fetch Monthly Payments
        this.http.get<any[]>(`${this.apiUrl}/MonthlyPayments`).subscribe({
            next: (data) => {
                this.monthlyPayments = data
                    .filter(p => p.studentId === this.studentId)
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            }
        });

        // Fetch Other Payments
        this.http.get<any[]>(`${this.apiUrl}/OthersPayments`).subscribe({
            next: (data) => {
                this.otherPayments = data
                    .filter(p => p.studentId === this.studentId)
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            }
        });
    }

    getStatusClass(remaining: number): string {
        if (remaining <= 0) return 'status-paid';
        return 'status-pending';
    }

    getStatusLabel(remaining: number): string {
        if (remaining <= 0) return 'Paid';
        return 'Pending';
    }
}
