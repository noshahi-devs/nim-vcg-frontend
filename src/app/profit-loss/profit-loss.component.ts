import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { AccountsService, ProfitLossReport } from '../services/accounts.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profit-loss',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, NgApexchartsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './profit-loss.component.html',
  styleUrl: './profit-loss.component.css'
})
export class ProfitLossComponent implements OnInit {
  title = 'Profit & Loss Report';
  report: ProfitLossReport | null = null;
  Math = Math;
  
  startDate = '';
  endDate = '';
  selectedCampus = '';
  campuses = ['Main Campus', 'Branch Campus'];

  chartOptions: any;

  constructor(private accountsService: AccountsService) {}

  ngOnInit(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
    this.generateReport();
  }

  generateReport(): void {
    if (!this.startDate || !this.endDate) {
      Swal.fire('Validation Error', 'Please select date range', 'warning');
      return;
    }

    if (new Date(this.startDate) > new Date(this.endDate)) {
      Swal.fire('Validation Error', 'Start date must be before end date', 'warning');
      return;
    }

    this.accountsService.getProfitLossReport(this.startDate, this.endDate, this.selectedCampus).subscribe({
      next: (data) => {
        this.report = data;
        this.initializeChart();
      },
      error: (err) => {
        console.error('Error generating report:', err);
        Swal.fire('Error', 'Failed to generate report', 'error');
      }
    });
  }

  initializeChart(): void {
    if (!this.report) return;

    this.chartOptions = {
      series: [this.report.totalIncome, this.report.totalExpenses],
      chart: {
        type: 'pie',
        height: 350
      },
      labels: ['Income', 'Expenses'],
      colors: ['#28a745', '#dc3545'],
      legend: {
        position: 'bottom'
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          return val.toFixed(1) + '%';
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  exportReport(): void {
    Swal.fire('Export', 'Exporting Profit & Loss report to PDF...', 'success');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getProfitLossClass(): string {
    if (!this.report) return '';
    return this.report.netProfit >= 0 ? 'text-success-main' : 'text-danger-main';
  }

  getProfitLossLabel(): string {
    if (!this.report) return '';
    return this.report.netProfit >= 0 ? 'Net Profit' : 'Net Loss';
  }
}