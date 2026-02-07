import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

declare var $: any;
@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.css'
})
export class TooltipComponent implements AfterViewInit {
  title = 'Tooltip';
  constructor() { }

  ngAfterViewInit() {
    let tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltipTriggerEl: any) => {
      new window['bootstrap'].Tooltip(tooltipTriggerEl);
    });


    $('.tooltip-button').each(function () {
      var tooltipButton = $(this);
      var tooltipContent = $(this).siblings('.my-tooltip').html();

      // Initialize the tooltip
      tooltipButton.tooltip({
        title: tooltipContent,
        trigger: 'hover',
        html: true
      });

      
      tooltipButton.on('mouseenter', () => {
        const currentTooltip = window['bootstrap'].Tooltip.getInstance(tooltipButton);

        if (currentTooltip) {
          currentTooltip.dispose();
        }

        const newTooltip = new window['bootstrap'].Tooltip(tooltipButton, {
          title: tooltipContent,
          trigger: 'hover',
          html: true,
        });

        newTooltip.show();
      });
    });

  }
}
