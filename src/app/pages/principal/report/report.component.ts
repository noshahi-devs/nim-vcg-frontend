import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
declare var $: any;
import {
  NgApexchartsModule,
  ChartComponent
} from 'ng-apexcharts';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { DashboardService } from '../../../services/dashboard.service';
import { AccountsService, DashboardData } from '../../../services/accounts.service';
import { CommonModule } from '@angular/common';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [NgApexchartsModule, BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  title = 'Insights Report';
  purchaseSaleChart;
  incomeExpense;
  userOverviewDonutChart;
  generatedAt = '';
  
  // Pagination
  currentPage = 1;
  rowsPerPage = 5;
  Math = Math;

  accountData: DashboardData | null = null;

  get paginatedTransactions() {
    if (!this.accountData?.recentTransactions) return [];
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    return this.accountData.recentTransactions.slice(startIndex, startIndex + this.rowsPerPage);
  }

  get totalPages() {
    if (!this.accountData?.recentTransactions) return 0;
    return Math.ceil(this.accountData.recentTransactions.length / this.rowsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(
    private dashboardService: DashboardService,
    private accountsService: AccountsService,
    private popup: PopupService
  ) {
    this.initStaticCharts();
  }

  ngOnInit() {
    this.popup.loading('Preparing report data...');
    this.accountsService.getDashboardData().subscribe({
      next: data => {
        this.accountData = data;
        this.generatedAt = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        this.updateHistoricalCharts(data.chartData);
        this.updateDonutChartFromAccount(data);
        this.popup.closeLoading();
      },
      error: () => {
        this.popup.closeLoading();
        this.popup.error('Load Failed', 'Could not load report data.');
      }
    });

    this.dashboardService.getStudentDistribution().subscribe(data => {
      // Keep student distribution as well
    });
  }

  initStaticCharts() {
    this.incomeExpense = this.createChartTwo('#800000', '#F4C430', [], [], []);

    this.userOverviewDonutChart = {
      series: [],
      colors: ['#F4C430', '#800000', '#45B369', '#9935FE', '#FF487F'],
      labels: [],
      legend: { show: false },
      chart: { type: 'donut', height: 270, sparkline: { enabled: true } },
      stroke: { width: 0 },
      dataLabels: { enabled: true }
    };

    this.purchaseSaleChart = {
      series: [{ name: 'Income', data: [] }, { name: 'Expense', data: [] }],
      colors: ['#45B369', '#FF9F29'],
      chart: { type: 'bar', height: 260, toolbar: { show: false } },
      xaxis: { categories: [] }
    };
  }

  updateHistoricalCharts(data: any) {
    const income = Array.isArray(data?.income) ? data.income.map((v: any) => Number(v) || 0) : [];
    const expenses = Array.isArray(data?.expenses)
      ? data.expenses.map((v: any) => Number(v) || 0)
      : (Array.isArray(data?.expense) ? data.expense.map((v: any) => Number(v) || 0) : []);
    const labels = Array.isArray(data?.months)
      ? data.months
      : (Array.isArray(data?.labels) ? data.labels : []);

    this.incomeExpense = this.createChartTwo('#800000', '#F4C430', income, expenses, labels);
    this.purchaseSaleChart = {
      ...this.purchaseSaleChart,
      series: [
        { name: 'Income', data: income },
        { name: 'Expense', data: expenses }
      ],
      xaxis: { categories: labels }
    };
  }

  updateDonutChart(data: any[]) {
    this.userOverviewDonutChart = {
      ...this.userOverviewDonutChart,
      series: data.map(d => d.count),
      labels: data.map(d => d.className)
    };
  }

  updateDonutChartFromAccount(data: any) {
    const totalIncome = Number(data?.totalIncome) || 0;
    const totalExpenses = Number(data?.totalExpenses) || 0;
    this.userOverviewDonutChart = {
      ...this.userOverviewDonutChart,
      series: [totalIncome, totalExpenses],
      labels: ['Income', 'Expenses'],
      colors: ['#800000', '#F4C430']
    };
  }

  createChartTwo(color1, color2, series1Data, series2Data, labels) {
    return {
      series: [{
        name: 'Income',
        data: series1Data
      }, {
        name: 'Expense',
        data: series2Data
      }],
      legend: {
        show: false
      },
      chart: {
        type: 'area',
        width: '100%',
        height: 270,
        toolbar: {
          show: false
        },
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: [color1, color2], // Use two colors for the lines
        lineCap: 'round'
      },
      grid: {
        show: true,
        borderColor: '#D1D5DB',
        strokeDashArray: 1,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        row: {
          colors: undefined,
          opacity: 0.5
        },
        column: {
          colors: undefined,
          opacity: 0.5
        },
        padding: {
          top: -20,
          right: 0,
          bottom: -10,
          left: 0
        },
      },
      fill: {
        type: 'gradient',
        colors: [color1, color2], // Use two colors for the gradient
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: [undefined, `${color2}00`], // Apply transparency to both colors
          inverseColors: false,
          opacityFrom: [0.4, 0.6], // Starting opacity for both colors
          opacityTo: [0.3, 0.3], // Ending opacity for both colors
          stops: [0, 100],
        },
      },
      markers: {
        colors: [color1, color2], // Use two colors for the markers
        strokeWidth: 3,
        size: 0,
        hover: {
          size: 10
        }
      },
      xaxis: {
        categories: labels.length > 0 ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        tooltip: {
          enabled: false
        },
        labels: {
          formatter: function (value) {
            return value;
          },
          style: {
            fontSize: "14px"
          }
        }
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            return "PKR " + value;
          },
          style: {
            fontSize: "14px"
          }
        },
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        }
      }
    };

  }
}
