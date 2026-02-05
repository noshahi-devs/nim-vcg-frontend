import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';
import { PaymentGatewaySetting, PaymentGatewayService } from '../../../services/payment-gateway.service';

@Component({
  selector: 'app-payment-gateway',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './payment-gateway.component.html',
  styleUrl: './payment-gateway.component.css'
})
export class PaymentGatewayComponent implements OnInit {
  title = 'Payment Gateway Settings';

  gateways: PaymentGatewaySetting[] = [];
  loading = false;

  constructor(private gatewayService: PaymentGatewayService) { }

  ngOnInit(): void {
    this.loadGateways();
  }

  loadGateways(): void {
    this.loading = true;
    this.gatewayService.getGateways().subscribe({
      next: (data) => {
        this.gateways = data;
        this.loading = false;
        if (this.gateways.length === 0) {
          // Seed defaults if empty for UI demo
          this.gateways = [
            { id: 0, gatewayName: 'Stripe', apiKey: '', secretKey: '', isActive: false, isTestMode: true, transactionFee: 0 },
            { id: 0, gatewayName: 'PayPal', apiKey: '', secretKey: '', isActive: false, isTestMode: true, transactionFee: 0 }
          ];
        }
      },
      error: () => this.loading = false
    });
  }

  saveGateway(gateway: PaymentGatewaySetting): void {
    if (gateway.id === 0) {
      this.gatewayService.createGateway(gateway).subscribe({
        next: (newGateway) => {
          gateway.id = newGateway.id;
          Swal.fire({ icon: 'success', title: 'Saved', showConfirmButton: false, timer: 1500 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error saving settings' })
      });
    } else {
      this.gatewayService.updateGateway(gateway.id, gateway).subscribe({
        next: () => Swal.fire({ icon: 'success', title: 'Updated', showConfirmButton: false, timer: 1500 }),
        error: () => Swal.fire({ icon: 'error', title: 'Error updating settings' })
      });
    }
  }
}
