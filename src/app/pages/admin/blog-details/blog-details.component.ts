import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-blog-details',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './blog-details.component.html',
  styleUrl: './blog-details.component.css'
})
export class BlogDetailsComponent {
  title = 'Blog Details';
}
