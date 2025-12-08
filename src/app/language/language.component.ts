import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-language',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './language.component.html',
  styleUrl: './language.component.css'
})
export class LanguageComponent implements AfterViewInit {
  title = 'Languages';
  constructor() { }

  ngAfterViewInit() {
    $('.remove-item-button').on('click', function () {
      $(this).closest('tr').addClass('d-none'); 
  }); 

  }

}
