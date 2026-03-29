import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationLog } from '../../../services/notification.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { PopupService } from '../../../services/popup.service';
import { finalize } from 'rxjs';

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
    successMsg = '';
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

    constructor(
        private notificationService: NotificationService,
        private popup: PopupService
    ) { }

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
        if (!this.broadcastData.title || !this.broadcastData.message) {
            this.popup.warning('Incomplete Broadcast', 'Please provide both a title and message content.');
            return;
        }

        if (this.selectedRoles.length === 0 && this.selectedSectionIds.length === 0) {
            this.popup.warning('No Recipients', 'Please select at least one role or target group.');
            return;
        }

        this.popup.loading('Transmitting system broadcast...');

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

        this.notificationService.broadcast(payload)
            .pipe(finalize(() => this.popup.closeLoading()))
            .subscribe({
                next: (res) => {
                    this.popup.success('Broadcast Sent!', `Message delivered to ${res.count ?? 'the targeted'} users.`);
                    this.broadcastData = { title: '', message: '', priority: 'normal' };
                    this.selectedRoles = [];
                    this.selectedSectionIds = [];
                    this.selectedSubjectIds = [];
                    this.loadLogs();
                },
                error: (err) => {
                    this.popup.error('Transmission Failed', 'Could not deliver the broadcast message.');
                    console.error('Broadcast error:', err);
                }
            });
    }

    loadLogs() {
        this.popup.loading('Retrieving broadcast history...');
        this.notificationService.getLogs()
            .pipe(finalize(() => this.popup.closeLoading()))
            .subscribe({
                next: (data) => {
                    this.logs = data;
                },
                error: () => this.popup.error('Load Failed', 'Could not retrieve broadcast logs.')
            });
    }

    getRoleIcon(role: string): string {
        const icons: Record<string, string> = {
            'Admin': 'mdi:shield-account',
            'Principal': 'mdi:account-tie',
            'Teacher': 'mdi:teach',
            'Accountant': 'mdi:calculator',
            'Student': 'mdi:account-group'
        };
        return icons[role] || 'mdi:account';
    }
}
