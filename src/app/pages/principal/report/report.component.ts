import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
declare var $: any;
import {
  NgApexchartsModule,
  ChartComponent
} from 'ng-apexcharts';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
@Component({
  selector: 'app-report',
  standalone: true,
  imports: [NgApexchartsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  title = 'Home 10';
  purchaseSaleChart;
  incomeExpense;
  userOverviewDonutChart;
  constructor() {


    this.incomeExpense = this.createChartTwo('#487FFF', '#FF9F29');
    this.userOverviewDonutChart = {
      series: [30, 30, 20, 20],
      colors: ['#FF9F29', '#487FFF', '#45B369', '#9935FE'],
      labels: ['Purchase', 'Sales', 'Expense', 'Gross Profit'],
      legend: {
        show: false
      },
      chart: {
        type: 'donut',
        height: 270,
        sparkline: {
          enabled: true // Remove whitespace
        },
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      stroke: {
        width: 0,
      },
      dataLabels: {
        enabled: true
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
      tooltip: {
        custom: ({ seriesIndex, series, dataPointIndex, w }) => {
          const donutColor = w.globals.colors[seriesIndex];
          const label = w.config.labels[seriesIndex];
          return `
            <div style="font-size: 12px; padding:5px 10px; background-color: ${donutColor}; color: white; ">
              ${label}: ${series[seriesIndex]} 
            </div>
          `;
        }
      },
    };

    this.purchaseSaleChart = {
      series: [{
        name: 'Net Profit',
        data: [44, 100, 40, 56, 30, 58, 50]
      }, {
        name: 'Free Cash',
        data: [60, 120, 60, 90, 50, 95, 90]
      }],
      colors: ['#45B369', '#FF9F29'],
      labels: ['Active', 'New', 'Total'],

      legend: {
        show: false
      },
      chart: {
        type: 'bar',
        height: 260,
        toolbar: {
          show: false
        },
      },
      grid: {
        show: true,
        borderColor: '#D1D5DB',
        strokeDashArray: 4, // Use a number for dashed style
        position: 'back',
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: 8,
        },
      },
      dataLabels: {
        enabled: false
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        }
      },
      stroke: {
        show: true,
        width: 0,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'],
      },
      fill: {
        opacity: 1,
        width: 18,
      },
    };

  }

  createChartTwo(color1, color2) {
    return {
      series: [{
        name: 'series1',
        data: [48, 35, 50, 32, 48, 40, 55, 50, 60]
      }, {
        name: 'series2',
        data: [12, 20, 15, 26, 22, 30, 25, 35, 25]
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
        // gradient: {
        //     shade: 'light',
        //     type: 'vertical',
        //     shadeIntensity: 0.5,
        //     gradientToColors: [`${color1}`, `${color2}00`], // Bottom gradient colors with transparency
        //     inverseColors: false,
        //     opacityFrom: .6,
        //     opacityTo: 0.3,
        //     stops: [0, 100],
        // },
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
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
            return "$" + value + "k";
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
