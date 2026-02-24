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
        // Fallback to mock data if API is down
        this.dashboardData = {
          totalIncome: 1250000,
          totalExpenses: 450000,
          profitLoss: 800000,
          cashBankBalance: 150000,
          recentTransactions: [
            { id: 1, transactionId: 'TRX-001', date: '2024-03-15', description: 'Tuition Fee - Class 10', credit: 50000, debit: 0, type: 'Income', category: 'Fee', balance: 50000 },
            { id: 2, transactionId: 'TRX-002', date: '2024-03-14', description: 'Electricity Bill', credit: 0, debit: 15000, type: 'Expense', category: 'Utilities', balance: 35000 },
            { id: 3, transactionId: 'TRX-003', date: '2024-03-14', description: 'Library Fines', credit: 2000, debit: 0, type: 'Income', category: 'Fine', balance: 37000 },
            { id: 4, transactionId: 'TRX-004', date: '2024-03-13', description: 'Staff Salary', credit: 0, debit: 250000, type: 'Expense', category: 'Payroll', balance: -213000 },
            { id: 5, transactionId: 'TRX-005', date: '2024-03-12', description: 'Transport Fee', credit: 35000, debit: 0, type: 'Income', category: 'Transport', balance: -178000 }
          ],
          chartData: {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            income: [800000, 950000, 1250000, 0, 0, 0],
            expenses: [400000, 420000, 450000, 0, 0, 0]
          }
        };
        this.initializeChart();
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
