import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, DashboardData } from '../../../services/accounts.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, NgApexchartsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit {
  title = 'Accounts Dashboard';
  dashboardData: DashboardData | null = null;

  // Chart configuration
  chartOptions: any;

  constructor(private accountsService: AccountsService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.accountsService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.initializeChart();
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        Swal.fire('Error', 'Failed to load dashboard data', 'error');
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
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: this.dashboardData.chartData.months
      },
      yaxis: {
        title: {
          text: 'Amount (PKR)'
        }
      },
      fill: {
        opacity: 1
      },
      colors: ['#28a745', '#dc3545'],
      legend: {
        position: 'top',
        horizontalAlign: 'right'
      },
      grid: {
        borderColor: '#e7e7e7',
        strokeDashArray: 4
      }
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
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
          <p><strong>Date:</strong> ${transaction.date}</p>
          <p><strong>Type:</strong> ${transaction.type}</p>
          <p><strong>Category:</strong> ${transaction.category}</p>
          <p><strong>Description:</strong> ${transaction.description}</p>
          <p><strong>Amount:</strong> ${this.formatCurrency(transaction.type === 'Income' ? transaction.credit : transaction.debit)}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close'
    });
  }

  exportData(): void {
    Swal.fire('Export', 'Exporting dashboard data...', 'success');
  }
}