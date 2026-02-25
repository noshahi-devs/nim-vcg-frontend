import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
declare var $: any;
import {
  NgApexchartsModule,
  ChartComponent
} from 'ng-apexcharts';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { DashboardService } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [NgApexchartsModule, BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  title = 'Analytics Report';
  purchaseSaleChart;
  incomeExpense;
  userOverviewDonutChart;

  constructor(private dashboardService: DashboardService) {
    this.initStaticCharts();
  }

  ngOnInit() {
    this.dashboardService.getChartData().subscribe(data => {
      this.updateHistoricalCharts(data);
    });

    this.dashboardService.getStudentDistribution().subscribe(data => {
      this.updateDonutChart(data);
    });
  }

  initStaticCharts() {
    this.incomeExpense = this.createChartTwo('#487FFF', '#FF9F29', [], [], []);

    this.userOverviewDonutChart = {
      series: [],
      colors: ['#FF9F29', '#487FFF', '#45B369', '#9935FE', '#FF487F'],
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
    this.incomeExpense = this.createChartTwo('#487FFF', '#FF9F29', data.income, data.expense, data.labels);
    this.purchaseSaleChart = {
      ...this.purchaseSaleChart,
      series: [
        { name: 'Income', data: data.income },
        { name: 'Expense', data: data.expense }
      ],
      xaxis: { categories: data.labels }
    };
  }

  updateDonutChart(data: any[]) {
    this.userOverviewDonutChart = {
      ...this.userOverviewDonutChart,
      series: data.map(d => d.count),
      labels: data.map(d => d.className)
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
