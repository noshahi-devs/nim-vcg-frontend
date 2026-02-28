import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppConfigService } from '../../../services/app-config.service';

@Component({
  selector: 'app-branding-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './branding-home.component.html',
  styleUrl: './branding-home.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BrandingHomeComponent {
  readonly currentYear = new Date().getFullYear();

  readonly metrics = [
    { value: '99.9%', label: 'Daily Uptime' },
    { value: '8x', label: 'Faster Admin Tasks' },
    { value: '24/7', label: 'Data Visibility' },
    { value: '10+', label: 'Core Modules' }
  ];

  readonly features = [
    {
      icon: 'solar:buildings-2-linear',
      title: 'Unified Campus Control',
      description: 'Run admissions, sections, classes, and staff management from one secure software platform.'
    },
    {
      icon: 'solar:wallet-money-linear',
      title: 'Finance Command Center',
      description: 'Track fees, salaries, income, expenses, and ledgers with clear reporting and less manual work.'
    },
    {
      icon: 'solar:clipboard-check-linear',
      title: 'Attendance Intelligence',
      description: 'Manage student and staff attendance with detailed reports and quick daily actions.'
    },
    {
      icon: 'solar:chart-2-linear',
      title: 'Decision Dashboards',
      description: 'Get instant analytics for principals and admins to improve planning and performance.'
    },
    {
      icon: 'solar:shield-check-linear',
      title: 'Role-Based Security',
      description: 'Built-in access controls keep each user focused only on the actions they are authorized for.'
    },
    {
      icon: 'solar:settings-linear',
      title: 'Configurable for Your Institute',
      description: 'Customize logo, details, settings, and workflows to match your institute operations.'
    }
  ];

  readonly launchSteps = [
    {
      step: 'Step 01',
      title: 'Set Up Your Institute Profile',
      detail: 'Configure institute branding, classes, sections, and users in minutes.'
    },
    {
      step: 'Step 02',
      title: 'Enable Teams and Permissions',
      detail: 'Assign roles for admin, principal, accountant, and teacher with proper controls.'
    },
    {
      step: 'Step 03',
      title: 'Operate Daily Workflows',
      detail: 'Start fee management, attendance, exams, and reporting from a single dashboard.'
    }
  ];

  constructor(private appConfig: AppConfigService) { }

  get config$() {
    return this.appConfig.config$;
  }
}
