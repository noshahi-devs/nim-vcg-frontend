import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SupportComponent {
  currentYear = new Date().getFullYear();
  supportDetails = {
    whatsapp: {
      number: '+92 307 5071297',
      link: 'https://wa.me/923075071297',
      label: 'WhatsApp Support'
    },
    call: {
      number: '+92 307 5071297',
      link: 'tel:+923075071297',
      label: 'Call Us'
    },
    email: {
      address: 'noshahidevelopersinc@gmail.com',
      link: 'mailto:noshahidevelopersinc@gmail.com',
      label: 'Email Support'
    }
  };

  // Feature Request Form
  showFeatureForm = false;
  featureData = {
    title: '',
    category: 'Dashboard',
    description: ''
  };

  constructor(private popupService: PopupService) {}

  openFeatureForm() {
    this.showFeatureForm = true;
  }

  closeFeatureForm() {
    this.showFeatureForm = false;
  }

  submitFeature() {
    if (!this.featureData.title || !this.featureData.description) {
      alert('Please fill in all fields before submitting.');
      return;
    }

    // Show premium processing popup
    this.popupService.loading('Submitting Your Request...');

    setTimeout(() => {
      // Create mailto link
      const email = 'noshahidevelopersinc@gmail.com';
      const subject = `Feature Request: ${this.featureData.title} (${this.featureData.category})`;
      const body = `Category: ${this.featureData.category}\n\nDescription: ${this.featureData.description}\n\nRequested by: Institute Manager User`;
      
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Close the processing popup
      this.popupService.closeLoading();
      
      // Open email client
      window.location.href = mailtoLink;

      // Close form
      this.showFeatureForm = false;
      this.featureData = { title: '', category: 'Dashboard', description: '' };
    }, 2000);
  }

  openLiveChat() {
    // This will now interact with the global chatbot in SideNav if needed, 
    // but since the chatbot is already visible on the support page via SideNav, 
    // we can just let it be or trigger a message.
  }

  requestFeature() {
    this.openFeatureForm();
  }
}
