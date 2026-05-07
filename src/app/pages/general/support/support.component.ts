import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SupportComponent {
  currentYear = new Date().getFullYear();
  supportDetails = {
    whatsapp: {
      number: '+92 300 000 0000',
      link: 'https://wa.me/923000000000',
      label: 'WhatsApp Support'
    },
    call: {
      number: '+92 300 000 0000',
      link: 'tel:+923000000000',
      label: 'Call Us'
    },
    email: {
      address: 'support@visioncollege.edu.pk',
      link: 'mailto:support@visioncollege.edu.pk',
      label: 'Email Support'
    }
  };

  openLiveChat() {
    // Placeholder for live chat logic
    console.log('Opening live chat...');
    alert('Live chat feature coming soon!');
  }

  requestFeature() {
    // Placeholder for feature request logic
    console.log('Requesting a feature...');
    alert('Feature request form coming soon!');
  }
}
