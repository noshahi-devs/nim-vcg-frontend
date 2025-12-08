import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
declare var $: any;

@Component({
  selector: 'app-users-grid',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './users-grid.component.html',
  styleUrl: './users-grid.component.css'
})
export class UsersGridComponent implements AfterViewInit {
  title = 'Users List';
  constructor() { }

  ngAfterViewInit() {
    $('.delete-btn').on('click', function () {
      $(this).closest('.user-grid-card').addClass('d-none')
    });

  }

}
