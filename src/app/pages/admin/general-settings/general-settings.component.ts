import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, SystemSetting, NotificationSetting, PaymentGatewaySetting } from '../../../services/settings.service';
import { NotificationService, NotificationLog } from '../../../services/notification.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

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
        preferredTheme: 'light' // Default
    };

    notificationSettings: NotificationSetting[] = [];
    paymentSettings: PaymentGatewaySetting[] = [];
    notificationLogs: NotificationLog[] = [];

    constructor(
        private settingsService: SettingsService,
        private notificationService: NotificationService
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
    }

    saveGeneralSettings() {
        const settingsToSend: SystemSetting[] = Object.keys(this.generalSettings).map(key => ({
            settingKey: key,
            settingValue: this.generalSettings[key],
            category: 'General'
        }));

        this.settingsService.updateGeneralSettings(settingsToSend).subscribe({
            next: () => Swal.fire('Success', 'General settings saved', 'success'),
            error: () => Swal.fire('Error', 'Failed to save settings', 'error')
        });
    }

    saveNotifications() {
        this.settingsService.updateNotificationSettings(this.notificationSettings).subscribe({
            next: () => Swal.fire('Success', 'Notification preferences updated', 'success'),
            error: () => Swal.fire('Error', 'Failed to update notifications', 'error')
        });
    }

    savePaymentGateway(setting: PaymentGatewaySetting) {
        this.settingsService.updatePaymentGatewaySetting(setting).subscribe({
            next: () => Swal.fire('Success', `${setting.gatewayName} settings updated`, 'success'),
            error: () => Swal.fire('Error', `Failed to update ${setting.gatewayName}`, 'error')
        });
    }

    setTab(tab: string) {
        this.activeTab = tab;
    }
}
