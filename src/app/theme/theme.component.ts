import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../pages/ui-elements/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-theme',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [BreadcrumbComponent],
  templateUrl: './theme.component.html',
  styleUrl: './theme.component.css'
})
export class ThemeComponent {
  title = 'Theme';
}
