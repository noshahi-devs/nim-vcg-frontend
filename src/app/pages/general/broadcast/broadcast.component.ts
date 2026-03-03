import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationLog } from '../../../services/notification.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-broadcast',
    standalone: true,
    imports: [CommonModule, FormsModule, BreadcrumbComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './broadcast.component.html',
    styleUrl: './broadcast.component.css'
})
export class BroadcastComponent implements OnInit {

    availableRoles = ['Admin', 'Principal', 'Teacher', 'Accountant', 'Student'];
    selectedRoles: string[] = [];
    sending = false;
    successMsg = '';
    loadingLogs = false;
    logs: NotificationLog[] = [];
    assignedSections: any[] = [];
    selectedSectionIds: number[] = [];
    selectedSubjectIds: number[] = [];
    isTeacher = false;

    broadcastData = {
        title: '',
        message: '',
        priority: 'normal'
    };

    constructor(private notificationService: NotificationService) { }

    ngOnInit(): void {
        this.loadLogs();
        this.filterRolesForUser();
    }

    private filterRolesForUser() {
        const user = JSON.parse(localStorage.getItem('JWT_USER') || '{}');
        const roles = user.roles || [];
        this.isTeacher = roles.includes('Teacher') && !roles.includes('Admin') && !roles.includes('Principal');

        if (this.isTeacher) {
            this.availableRoles = ['Student'];
            this.loadMySections();
        }
    }

    loadMySections() {
        this.notificationService.getMySections().subscribe({
            next: (sections) => this.assignedSections = sections,
            error: (err) => console.error('Error loading sections', err)
        });
    }

    toggleSection(sectionId: number) {
        const idx = this.selectedSectionIds.indexOf(sectionId);
        if (idx >= 0) {
            this.selectedSectionIds.splice(idx, 1);
        } else {
            this.selectedSectionIds.push(sectionId);
        }
    }

    toggleSubject(subjectId: number) {
        const idx = this.selectedSubjectIds.indexOf(subjectId);
        if (idx >= 0) {
            this.selectedSubjectIds.splice(idx, 1);
        } else {
            this.selectedSubjectIds.push(subjectId);
        }
    }

    getUniqueSubjects() {
        const subjects: any[] = [];
        const seen = new Set();
        this.assignedSections.forEach(s => {
            if (!seen.has(s.subjectId)) {
                seen.add(s.subjectId);
                subjects.push({ id: s.subjectId, name: s.subjectName });
            }
        });
        return subjects;
    }

    toggleRole(role: string) {
        const idx = this.selectedRoles.indexOf(role);
        if (idx >= 0) {
            this.selectedRoles.splice(idx, 1);
        } else {
            this.selectedRoles.push(role);
        }
    }

    sendBroadcast() {
        if (!this.broadcastData.title || !this.broadcastData.message) return;
        this.sending = true;
        this.successMsg = '';

        const payload = {
            title: this.broadcastData.title,
            message: this.broadcastData.message,
            notificationType: this.broadcastData.priority === 'urgent' ? 'Urgent' :
                this.broadcastData.priority === 'important' ? 'Important' : 'Broadcast',
            link: '',
            targetRoles: this.selectedRoles,
            targetSectionIds: this.selectedSectionIds,
            targetSubjectIds: this.selectedSubjectIds
        };

        this.notificationService.broadcast(payload).subscribe({
            next: (res) => {
                this.sending = false;
                this.successMsg = `Broadcast sent successfully to ${res.count ?? 'all'} users!`;
                this.broadcastData = { title: '', message: '', priority: 'normal' };
                this.selectedRoles = [];
                this.loadLogs();
                setTimeout(() => this.successMsg = '', 5000);
            },
            error: () => {
                this.sending = false;
                this.successMsg = 'Failed to send broadcast. Please try again.';
            }
        });
    }

    loadLogs() {
        this.loadingLogs = true;
        this.notificationService.getLogs().subscribe({
            next: (data) => {
                this.logs = data;
                this.loadingLogs = false;
            },
            error: () => this.loadingLogs = false
        });
    }

    getRoleIcon(role: string): string {
        const icons: Record<string, string> = {
            'Admin': 'mdi:shield-account',
            'Principal': 'mdi:account-tie',
            'Teacher': 'mdi:teach',
            'Accountant': 'mdi:calculator',
            'Student': 'mdi:account-school'
        };
        return icons[role] || 'mdi:account';
    }
}
