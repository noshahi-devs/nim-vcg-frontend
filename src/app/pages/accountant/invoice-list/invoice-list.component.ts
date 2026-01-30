import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [BreadcrumbComponent, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.css',
})
export class InvoiceListComponent {
  title = 'Invoice List';
}
