import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, ProfitLossReport } from '../../../services/accounts.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import Swal from '../../../swal';

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
  generatedAt = '';

  chartOptions: any;

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

  constructor(private accountsService: AccountsService) { }

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

    this.accountsService.getProfitLossReport(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.report = data;
        this.generatedAt = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
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
    const primary = this.getThemeColor('--primary-color', '#28a745');
    const secondary = this.getThemeColor('--secondary-color', '#dc3545');

    this.chartOptions = {
      series: [this.report.totalIncome, this.report.totalExpenses],
      chart: {
        type: 'pie',
        height: 350
      },
      labels: ['Income', 'Expenses'],
      colors: [primary, secondary],
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
    if (!this.report) {
      this.triggerError('No Report', 'Please generate the report first before exporting.');
      return;
    }

    this.isProcessing = true;
    setTimeout(() => {
      try {
        const _r = this.report!;
        const csvRows: string[] = [];
        
        // Report Header
        csvRows.push(`"Profit & Loss Report",""`);
        csvRows.push(`"Generated","${this.generatedAt}"`);
        csvRows.push(`"Date Range","${_r.startDate} to ${_r.endDate}"`);
        csvRows.push(`"",""`);
        
        // Income Breakdown
        csvRows.push(`"INCOME BY CATEGORY",""`);
        csvRows.push(`"Category","Amount (PKR)"`);
        _r.incomeByCategory.forEach(ic => {
          csvRows.push(`"${ic.category}","${ic.amount}"`);
        });
        csvRows.push(`"Total Income","${_r.totalIncome}"`);
        csvRows.push(`"",""`);

        // Expense Breakdown
        csvRows.push(`"EXPENSE BY CATEGORY",""`);
        csvRows.push(`"Category","Amount (PKR)"`);
        _r.expenseByCategory.forEach(ec => {
          csvRows.push(`"${ec.category}","${ec.amount}"`);
        });
        csvRows.push(`"Total Expenses","${_r.totalExpenses}"`);
        csvRows.push(`"",""`);

        // Net Result
        const profitStatus = _r.netProfit >= 0 ? 'Net Profit' : 'Net Loss';
        csvRows.push(`"OVERALL RESULT",""`);
        csvRows.push(`"${profitStatus}","${_r.netProfit}"`);

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        link.setAttribute("download", `Profit_Loss_Report_${_r.startDate}_to_${_r.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.isProcessing = false;
        this.triggerSuccess('Export Complete!', 'Profit & Loss report has been generated.');
      } catch (err) {
        console.error('Export failed:', err);
        this.isProcessing = false;
        this.triggerError('Export Failed', 'An error occurred while generating the report.');
      }
    }, 800);
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

  getRangeDays(): number {
    if (!this.startDate || !this.endDate) return 0;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.floor(diff / 86400000) + 1;
  }

  private getThemeColor(variable: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return value || fallback;
  }
}


