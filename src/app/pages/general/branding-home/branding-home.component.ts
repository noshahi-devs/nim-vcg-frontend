import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnDestroy, OnInit } from '@angular/core';
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
export class BrandingHomeComponent implements OnInit, OnDestroy {
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

  readonly ratingScale = [1, 2, 3, 4, 5];

  readonly clientReviews = [
    {
      name: 'Ayesha Khan',
      role: 'Principal, Vision College Gojra',
      initials: 'AK',
      quote: 'Admissions and fee workflows are now centralized. Our admin office saves hours every day and parents get faster responses.',
      result: '38% faster office operations'
    },
    {
      name: 'Umer Farooq',
      role: 'Director, Bright Future School',
      initials: 'UF',
      quote: 'Attendance, salaries, and reports are no longer manual. The dashboard gives leadership complete control without extra staff.',
      result: '2.4x reporting speed'
    },
    {
      name: 'Sana Javed',
      role: 'Campus Head, Scholars Institute',
      initials: 'SJ',
      quote: 'The system is stable, easy for teachers, and transparent for finance. It gave us a professional digital identity in one platform.',
      result: '99.9% uptime confidence'
    },
    {
      name: 'Hamza Ali',
      role: 'Administrator, Allied Academy',
      initials: 'HA',
      quote: 'Fee collection and challan tracking are now streamlined. We can close monthly accounts without delays or data confusion.',
      result: '31% faster fee reconciliation'
    },
    {
      name: 'Rabia Noor',
      role: 'Operations Lead, Crescent Grammar',
      initials: 'RN',
      quote: 'Staff attendance and salary workflows became predictable and transparent. Even new team members adopt the system quickly.',
      result: '52% fewer manual corrections'
    },
    {
      name: 'Bilal Ahmad',
      role: 'Director, Nova Science School',
      initials: 'BA',
      quote: 'The dashboards gave us instant insights for admissions and finance. Decision-making is now data-driven instead of reactive.',
      result: '2x better planning visibility'
    }
  ];

  reviewIndex = 0;

  readonly reviewsCursor = {
    x: 0,
    y: 0,
    active: false
  };

  private reviewAutoRotate?: ReturnType<typeof setInterval>;

  constructor(private appConfig: AppConfigService) { }

  get config$() {
    return this.appConfig.config$;
  }

  formatInstituteName(name?: string | null): string {
    const fallbackName = 'Noshahi Institute';
    const instituteName = (name || fallbackName).trim();

    // Remove trailing "Manager" for cleaner branding in logo areas.
    return instituteName.replace(/\s+manager$/i, '').trim();
  }

  ngOnInit(): void {
    this.startReviewAutoRotate();
  }

  ngOnDestroy(): void {
    this.stopReviewAutoRotate();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.reviewIndex = Math.min(this.reviewIndex, this.maxReviewIndex);
  }

  get visibleReviewCards(): number {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;

    if (width <= 640) {
      return 1;
    }

    if (width <= 1024) {
      return 2;
    }

    return 3;
  }

  get maxReviewIndex(): number {
    return Math.max(0, this.clientReviews.length - this.visibleReviewCards);
  }

  get reviewDots(): number[] {
    return Array.from({ length: this.maxReviewIndex + 1 }, (_, i) => i);
  }

  prevReview(): void {
    if (this.maxReviewIndex === 0) {
      return;
    }

    this.reviewIndex = this.reviewIndex <= 0 ? this.maxReviewIndex : this.reviewIndex - 1;
    this.restartReviewAutoRotate();
  }

  nextReview(shouldRestart = true): void {
    if (this.maxReviewIndex === 0) {
      return;
    }

    this.reviewIndex = this.reviewIndex >= this.maxReviewIndex ? 0 : this.reviewIndex + 1;
    if (shouldRestart) {
      this.restartReviewAutoRotate();
    }
  }

  goToReview(index: number): void {
    this.reviewIndex = Math.max(0, Math.min(index, this.maxReviewIndex));
    this.restartReviewAutoRotate();
  }

  onReviewsMouseMove(event: MouseEvent): void {
    const section = event.currentTarget as HTMLElement | null;
    if (!section) {
      return;
    }

    const bounds = section.getBoundingClientRect();
    this.reviewsCursor.x = event.clientX - bounds.left;
    this.reviewsCursor.y = event.clientY - bounds.top;
    this.reviewsCursor.active = true;
  }

  onReviewsMouseLeave(): void {
    this.reviewsCursor.active = false;
  }

  private startReviewAutoRotate(): void {
    this.stopReviewAutoRotate();

    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || this.maxReviewIndex === 0) {
      return;
    }

    this.reviewAutoRotate = setInterval(() => this.nextReview(false), 4500);
  }

  private stopReviewAutoRotate(): void {
    if (this.reviewAutoRotate) {
      clearInterval(this.reviewAutoRotate);
      this.reviewAutoRotate = undefined;
    }
  }

  private restartReviewAutoRotate(): void {
    this.startReviewAutoRotate();
  }
}
