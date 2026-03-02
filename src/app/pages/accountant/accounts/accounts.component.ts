import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, DashboardData } from '../../../services/accounts.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AuthService } from '../../../SecurityModels/auth.service';
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, NgApexchartsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit, OnDestroy {
  title = 'Accounts Dashboard';
  dashboardData: DashboardData | null = null;
  loading = true;

  // Hero Banner Properties
  greeting = '';
  currentTime = '';
  currentDate = '';
  private timerSubscription?: Subscription;

  // Chart configuration
  chartOptions: any;

  constructor(
    private accountsService: AccountsService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.updateGreeting();
    this.startClock();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private startClock(): void {
    this.updateTime();
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateTime();
    });
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  private updateGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good Morning';
    else if (hour < 17) this.greeting = 'Good Afternoon';
    else this.greeting = 'Good Evening';
  }

  getInitials(name: string): string {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  loadDashboardData(): void {
    this.loading = true;
    this.accountsService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.initializeChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.loading = false;
        Swal.fire('Error', 'Failed to load live financial data. Please try again later.', 'error');
      }
    });
  }

  initializeChart(): void {
    if (!this.dashboardData) return;

    this.chartOptions = {
      series: [
        {
          name: 'Income',
          data: this.dashboardData.chartData.income
        },
        {
          name: 'Expenses',
          data: this.dashboardData.chartData.expenses
        }
      ],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false },
        dropShadow: {
          enabled: true,
          top: 3,
          left: 14,
          blur: 4,
          opacity: 0.12,
          color: '#6366f1',
        },
      },
      markers: { size: 4, colors: ['#10b981', '#ef4444'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 7 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 3, curve: 'smooth' },
      xaxis: {
        categories: this.dashboardData.chartData.months,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => this.formatCurrencyShort(val)
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      colors: ['#10b981', '#ef4444'],
      legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatCurrencyShort(amount: number): string {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
    return amount.toString();
  }

  getStatusClass(type: string): string {
    return type === 'Income'
      ? 'bg-success-focus text-success-main px-12 py-4 radius-4 fw-medium text-sm'
      : 'bg-danger-focus text-danger-main px-12 py-4 radius-4 fw-medium text-sm';
  }

  viewTransaction(transaction: any): void {
    Swal.fire({
      title: 'Transaction Details',
      html: `
        <div class="text-start">
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
          <p><strong>Type:</strong> <span class="badge ${transaction.type === 'Income' ? 'bg-success' : 'bg-danger'}">${transaction.type}</span></p>
          <p><strong>Category:</strong> ${transaction.category}</p>
          <p><strong>Description:</strong> ${transaction.description}</p>
          <hr>
          <p class="mb-0 fs-5"><strong>Amount:</strong> <span class="fw-bold ${transaction.type === 'Income' ? 'text-success' : 'text-danger'}">${this.formatCurrency(transaction.type === 'Income' ? transaction.credit : transaction.debit)}</span></p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
      confirmButtonColor: '#6366f1'
    });
  }

  exportData(): void {
    Swal.fire({
      title: 'Export Data',
      text: 'Do you want to export the accounts dashboard data to Excel?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Export',
      confirmButtonColor: '#10b981'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Exporting...', 'Generating report...', 'info');
        setTimeout(() => {
          Swal.fire('Exported!', 'The report has been generated successfully.', 'success');
        }, 1500);
      }
    });
  }
}
