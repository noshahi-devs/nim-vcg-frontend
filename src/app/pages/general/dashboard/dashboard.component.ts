import { AfterViewInit, OnInit, Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
declare var $: any;
import {
  NgApexchartsModule,
  ChartComponent
} from 'ng-apexcharts';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { DashboardService, DashboardStats } from '../../../services/dashboard.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  imports: [NgApexchartsModule, BreadcrumbComponent, CommonModule]
})
export class DashboardComponent implements AfterViewInit, OnInit {
  title = 'School Dashboard';
  stats: DashboardStats | null = null;

  @ViewChild("chart") chart: ChartComponent;
  chartOptions;
  barChartOptions;
  donutChartOptions;
  paymentStatusChartOptions;

  constructor(private dashboardService: DashboardService) {
    this.initCharts();
  }

  ngOnInit() {
    this.dashboardService.getStats().subscribe(data => {
      this.stats = data;
    });

    this.dashboardService.getChartData().subscribe(data => {
      this.updateHistoricalCharts(data);
    });

    this.dashboardService.getStudentDistribution().subscribe(data => {
      this.updateDonutChart(data);
    });
  }

  initCharts() {
    // Initial empty/placeholder state for charts
    this.chartOptions = {
      series: [{ name: 'Fee Collection', data: [] }],
      chart: { height: 264, type: 'line', toolbar: { show: false } },
      stroke: { curve: 'smooth', colors: ['#487FFF'], width: 3 },
      xaxis: { categories: [] }
    };

    this.barChartOptions = {
      series: [{ name: "New Admissions", data: [] }],
      chart: { type: 'bar', height: 235, toolbar: { show: false } },
      xaxis: { categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
    };

    this.donutChartOptions = {
      series: [],
      colors: ['#487FFF', '#FF9F29', '#45B369', '#9935FE', '#FF487F'],
      labels: [],
      chart: { type: 'donut', height: 270, sparkline: { enabled: true } },
      legend: { show: false }
    };

    this.paymentStatusChartOptions = {
      series: [
        { name: 'Income', data: [] },
        { name: 'Expense', data: [] }
      ],
      colors: ['#487FFF', '#FF9F29'],
      chart: { type: 'bar', height: 250, toolbar: { show: false } },
      xaxis: { categories: [] }
    };
  }

  updateHistoricalCharts(data: any) {
    // Update Line Chart (Fee/Income Trend)
    this.chartOptions = {
      ...this.chartOptions,
      series: [{ name: 'Monthly Income', data: data.income }],
      xaxis: { ...this.chartOptions.xaxis, categories: data.labels }
    };

    // Update Income vs Expense Bar Chart
    this.paymentStatusChartOptions = {
      ...this.paymentStatusChartOptions,
      series: [
        { name: 'Income', data: data.income },
        { name: 'Expense', data: data.expense }
      ],
      xaxis: { ...this.paymentStatusChartOptions.xaxis, categories: data.labels }
    };
  }

  updateDonutChart(data: any[]) {
    this.donutChartOptions = {
      ...this.donutChartOptions,
      series: data.map(d => d.count),
      labels: data.map(d => d.className)
    };
  }
  ngAfterViewInit(): void {
    $('#world-map').vectorMap(
      {
        map: 'world_mill_en',
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderOpacity: 0.25,
        borderWidth: 0,
        color: '#000000',
        regionStyle: {
          initial: {
            fill: '#D1D5DB'
          }
        },
        markerStyle: {
          initial: {
            r: 5,
            'fill': '#fff',
            'fill-opacity': 1,
            'stroke': '#000',
            'stroke-width': 1,
            'stroke-opacity': 0.4
          },
        },
        markers: [{
          latLng: [35.8617, 104.1954],
          name: 'China : 250'
        },

        {
          latLng: [25.2744, 133.7751],
          name: 'AustrCalia : 250'
        },

        {
          latLng: [36.77, -119.41],
          name: 'USA : 82%'
        },

        {
          latLng: [55.37, -3.41],
          name: 'UK   : 250'
        },

        {
          latLng: [25.20, 55.27],
          name: 'UAE : 250'
        }],

        series: {
          regions: [{
            values: {
              "US": '#487FFF ',
              "SA": '#487FFF',
              "AU": '#487FFF',
              "CN": '#487FFF',
              "GB": '#487FFF',
              "PK": '#487FFF',
              "IN": '#487FFF',
            },
            attribute: 'fill'
          }]
        },
        hoverOpacity: null,
        normalizeFunction: 'linear',
        zoomOnScroll: false,
        scaleColors: ['#000000', '#000000'],
        selectedColor: '#000000',
        selectedRegions: [],
        enableZoom: false,
        hoverColor: '#fff',
      });
  }
}
