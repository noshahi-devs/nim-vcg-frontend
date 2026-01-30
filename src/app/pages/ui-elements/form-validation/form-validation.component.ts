import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-form-validation',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './form-validation.component.html',
  styleUrl: './form-validation.component.css'
})
export class FormValidationComponent {
  title = 'Form Validation';
}
