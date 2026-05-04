import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, SystemSetting, NotificationSetting, PaymentGatewaySetting } from '../../../services/settings.service';
import { NotificationService, NotificationLog } from '../../../services/notification.service';
import { AcademicYearService } from '../../../services/academic-year.service';
import { SessionService } from '../../../services/session.service';
import { AppConfigService } from '../../../services/app-config.service';
import { AcademicYear } from '../../../Models/academic-year';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from '../../../swal';

@Component({
    selector: 'app-general-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, BreadcrumbComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './general-settings.component.html',
    styleUrl: './general-settings.component.css'
})
export class GeneralSettingsComponent implements OnInit {
    title = 'System Administration';
    activeTab = 'general';

    generalSettings: any = {
        instituteName: '',
        instituteAddress: '',
        institutePhone: '',
        instituteEmail: '',
        academicYear: '',
        currencySymbol: 'PKR',
        logoUrl: '',
        preferredTheme: 'light', // Default
        primaryColor: '#005bea', // Default modern primary color
        secondaryColor: '#ff6a00' // Default modern secondary color
    };

    notificationSettings: NotificationSetting[] = [];
    paymentSettings: PaymentGatewaySetting[] = [];
    notificationLogs: NotificationLog[] = [];

    // Premium UI State
    showConfirmModal = false;
    showDeleteConfirmModal = false;
    idToDelete: number | null = null;
    showFeedbackModal = false;
    feedbackType: 'success' | 'error' | 'warning' = 'success';
    feedbackTitle = '';
    feedbackMessage = '';
    isSaving = false;
 
    // Academic Session Management
    academicYears: AcademicYear[] = [];
    newSessionName: string = '';

    constructor(
        private settingsService: SettingsService,
        private notificationService: NotificationService,
        private academicYearService: AcademicYearService,
        private sessionService: SessionService,
        private appConfig: AppConfigService
    ) { }

    ngOnInit(): void {
        this.loadAllSettings();
    }

    loadAllSettings() {
        this.settingsService.getGeneralSettings().subscribe(data => {
            data.forEach(s => {
                if (this.generalSettings.hasOwnProperty(s.settingKey)) {
                    this.generalSettings[s.settingKey] = s.settingValue;
                }
            });
        });

        this.settingsService.getNotificationSettings().subscribe(data => {
            this.notificationSettings = data;
        });

        this.settingsService.getPaymentGatewaySettings().subscribe(data => {
            this.paymentSettings = data;
        });

        this.notificationService.getLogs().subscribe(data => {
            this.notificationLogs = data;
        });

        this.loadAcademicYears();
    }

    loadAcademicYears() {
        this.academicYearService.getAcademicYears().subscribe(data => {
            this.academicYears = data;
        });
    }

    addSession() {
        if (!this.newSessionName) {
            this.showFeedback('warning', 'Session Name Required', 'Please enter a name for the new academic session (e.g. 2024-25).');
            return;
        }

        const newSession: AcademicYear = {
            academicYearId: 0,
            name: this.newSessionName
        };

        this.isSaving = true;
        this.academicYearService.createAcademicYear(newSession).subscribe({
            next: () => {
                this.isSaving = false;
                this.showFeedback('success', 'Session Added', `Academic session <b>${this.newSessionName}</b> has been created.`);
                this.newSessionName = '';
                this.loadAcademicYears();
            },
            error: () => {
                this.isSaving = false;
                this.showFeedback('error', 'Update Failed', 'Failed to add new academic session.');
            }
        });
    }

    deleteSession(id: number) {
        this.idToDelete = id;
        this.showDeleteConfirmModal = true;
    }

    cancelDelete() {
        this.showDeleteConfirmModal = false;
        this.idToDelete = null;
    }

    confirmDeleteSession() {
        if (this.idToDelete === null) return;
        
        this.isSaving = true;
        this.showDeleteConfirmModal = false;

        this.academicYearService.deleteAcademicYear(this.idToDelete).subscribe({
            next: () => {
                this.isSaving = false;
                this.idToDelete = null;
                this.showFeedback('success', 'Session Deleted', 'The academic session has been removed.');
                this.loadAcademicYears();
            },
            error: () => {
                this.isSaving = false;
                this.idToDelete = null;
                this.showFeedback('error', 'Deletion Failed', 'Failed to delete the academic session.');
            }
        });
    }

    saveGeneralSettings() {
        this.showConfirmModal = true;
    }

    cancelUpdate() {
        this.showConfirmModal = false;
    }

    confirmUpdateGeneral() {
        this.isSaving = true;
        this.showConfirmModal = false;

        const settingsToSend: SystemSetting[] = Object.keys(this.generalSettings).map(key => ({
            settingKey: key,
            settingValue: this.generalSettings[key] || '',
            category: 'General'
        }));

        this.settingsService.updateGeneralSettings(settingsToSend).subscribe({
            next: () => {
                this.isSaving = false;
                this.showFeedback('success', 'Settings Saved', 'General institute settings have been updated successfully.');
                this.sessionService.refreshSession(true);
                this.appConfig.loadConfig().subscribe();
            },
            error: () => {
                this.isSaving = false;
                this.showFeedback('error', 'Save Failed', 'An unexpected error occurred while saving general settings.');
            }
        });
    }

    showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
        this.feedbackType = type;
        this.feedbackTitle = title;
        this.feedbackMessage = message;
        this.showFeedbackModal = true;
    }

    closeFeedback() {
        this.showFeedbackModal = false;
    }

    saveNotifications() {
        this.isSaving = true;
        this.settingsService.updateNotificationSettings(this.notificationSettings).subscribe({
            next: () => {
                this.isSaving = false;
                this.showFeedback('success', 'Notifications Updated', 'Your notification preferences have been saved.');
            },
            error: () => {
                this.isSaving = false;
                this.showFeedback('error', 'Update Failed', 'Failed to update notification settings.');
            }
        });
    }

    savePaymentGateway(setting: PaymentGatewaySetting) {
        this.isSaving = true;
        this.settingsService.updatePaymentGatewaySetting(setting).subscribe({
            next: () => {
                this.isSaving = false;
                this.showFeedback('success', 'Gateway Updated', `<b>${setting.gatewayName}</b> settings have been updated.`);
            },
            error: () => {
                this.isSaving = false;
                this.showFeedback('error', 'Update Failed', `Failed to update <b>${setting.gatewayName}</b>.`);
            }
        });
    }

    addNewPaymentGateway() {
        this.paymentSettings.push({
            id: 0,
            gatewayName: 'New Payment Gateway',
            apiKey: '',
            apiSecret: '',
            merchantId: '',
            isActive: false
        });
    }

    onLogoSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            // Check file type and size if needed
            if (!file.type.match(/image\/*/)) {
                this.showFeedback('error', 'Invalid File', 'Please select an image file (PNG, JPG).');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                this.showFeedback('warning', 'File Too Large', 'Logo image should not exceed 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.generalSettings.logoUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    triggerFileInput() {
        document.getElementById('logoFileInput')?.click();
    }

    removeLogo() {
        this.generalSettings.logoUrl = '';
    }

    setTab(tab: string) {
        this.activeTab = tab;
    }
}


