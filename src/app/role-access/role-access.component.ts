import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-role-access',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './role-access.component.html',
  styleUrl: './role-access.component.css'
})
export class RoleAccessComponent implements AfterViewInit {
  title = 'Role Access';
  constructor() { }

  ngAfterViewInit() {
    $('.remove-item-btn').on('click', function () {
      $(this).closest('tr').addClass('d-none')
    });

  }

}
