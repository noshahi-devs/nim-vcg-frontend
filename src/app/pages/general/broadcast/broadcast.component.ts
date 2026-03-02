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

    availableRoles = ['Admin', 'Principal', 'Teacher', 'Accountant'];
    selectedRoles: string[] = [];
    sending = false;
    successMsg = '';
    loadingLogs = false;
    logs: NotificationLog[] = [];

    broadcastData = {
        title: '',
        message: '',
        priority: 'normal'
    };

    constructor(private notificationService: NotificationService) { }

    ngOnInit(): void {
        this.loadLogs();
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
            link: ''
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
            'Accountant': 'mdi:calculator'
        };
        return icons[role] || 'mdi:account';
    }
}
