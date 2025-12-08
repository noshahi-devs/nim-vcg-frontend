import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-marketplace-details',
  standalone: true,
  imports: [NgApexchartsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './marketplace-details.component.html',
  styleUrl: './marketplace-details.component.css'
})
export class MarketplaceDetailsComponent implements AfterViewInit {
  title = 'Marketplace Details';
   dates = [
    [1327359600000, 30.95],
    [1327446000000, 31.34],
    [1327532400000, 31.18],
    [1327618800000, 31.05],
    [1327878000000, 31.00],
    [1327964400000, 30.95],
    [1328050800000, 31.24],
    [1328137200000, 31.29],
    [1328223600000, 31.85],
    [1328482800000, 31.86],
    [1328569200000, 32.28],
    [1328655600000, 32.10],
    [1328742000000, 32.65],
    [1328828400000, 32.21],
    [1329087600000, 32.35],
    [1329174000000, 32.44],
    [1329260400000, 32.46],
    [1329346800000, 32.86],
    [1329433200000, 32.75],
    [1329778800000, 32.54],
    [1329865200000, 32.33],
    [1329951600000, 32.97],
    [1330038000000, 33.41],
    [1330297200000, 33.27],
    [1330383600000, 33.27],
    [1330470000000, 32.89],
    [1330556400000, 33.10],
    [1330642800000, 33.73],
];
timeSeriesChart;
  constructor() {

    // Zoomable Time Series Chart Start
    this.timeSeriesChart = {
      series: [{
          name: 'Bitcoin',
          data: this.dates
      }],
      chart: {
          type: 'area',
          stacked: false,
          height: 350,
          zoom: {
              type: 'x',
              enabled: true,
              autoScaleYaxis: true
          },
          toolbar: {
              show: false
          },
      },
      stroke: {
          curve: 'straight',
          width: 2,
          color: ["#000"],
          lineCap: 'round',
      },
      dataLabels: {
          enabled: false
      },
      markers: {
          size: 0,
      },
      grid: {
          borderColor: '#D1D5DB',
          strokeDashArray: 3,
      },
      fill: {
          type: 'gradient',
          gradient: {
            type: 'vertical',  // Gradient direction (vertical)
            shadeIntensity: 1, // Intensity of the gradient shading
            gradientToColors: ['#487FFF'], // Bottom gradient color (with transparency)
            inverseColors: false, // Do not invert colors
            opacityFrom: .4, // Starting opacity
            opacityTo: .1,  // Ending opacity
            stops: [0, 100],
        },
      },
      yaxis: {
          labels: {
              formatter: function (val) {
                  return (val / 1000000).toFixed(0);
              },
          },
          title: {
              text: 'Price'
          },
      },
      xaxis: {
          type: 'datetime',
      },
      tooltip: {
          shared: false,
          y: {
              formatter: function (val) {
                  return (val / 1000000).toFixed(0);
              }
          }
      }
  };

   }

  ngAfterViewInit() {
    $('.star-btn').on('click', function () {
      if ($(this).children().hasClass('ri-star-line')) {
        $(this).children().removeClass('ri-star-line');
        $(this).children().addClass('ri-star-fill text-primary-600');
      } else {
        $(this).children().removeClass('ri-star-fill text-primary-600');
        $(this).children().addClass('ri-star-line');
      }
    });

  }
}
