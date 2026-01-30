import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent {
  title = 'Forms';
}
