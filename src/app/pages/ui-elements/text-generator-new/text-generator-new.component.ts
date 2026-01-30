import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-text-generator-new',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './text-generator-new.component.html',
  styleUrl: './text-generator-new.component.css'
})
export class TextGeneratorNewComponent {
  title = 'Text Generator';
}
