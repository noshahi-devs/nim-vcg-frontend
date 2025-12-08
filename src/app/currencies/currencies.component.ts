import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-currencies',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './currencies.component.html',
  styleUrl: './currencies.component.css'
})
export class CurrenciesComponent implements AfterViewInit {
  title = 'Currencies';
  constructor() { }

  ngAfterViewInit() {
    $('.remove-item-button').on('click', function () {
      $(this).closest('tr').addClass('d-none'); 
  }); 

  }

}
