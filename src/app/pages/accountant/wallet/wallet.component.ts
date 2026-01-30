import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.css'
})
export class WalletComponent {
  title = 'Wallet';

}
