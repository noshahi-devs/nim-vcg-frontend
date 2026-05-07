import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PopupService } from '../../../services/popup.service';
import { SupportService } from '../../../services/support.service';
import { AuthService } from '../../../SecurityModels/auth.service';

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

  constructor(
    private popupService: PopupService,
    private supportService: SupportService,
    private authService: AuthService
  ) {}

  openFeatureForm() {
    this.showFeatureForm = true;
  }

  closeFeatureForm() {
    this.showFeatureForm = false;
  }

  submitFeature() {
    if (!this.featureData.title || !this.featureData.description) {
      this.popupService.warning('Please fill in all fields before submitting.', 'Form Incomplete');
      return;
    }

    // Show premium processing popup
    this.popupService.loading('Submitting Your Request...');

    // Get current user info
    const user = this.authService.userValue;
    const requestPayload = {
      ...this.featureData,
      userEmail: user?.email,
      userName: user?.fullName || user?.username
    };

    this.supportService.submitFeature(requestPayload).subscribe({
      next: (response) => {
        this.popupService.closeLoading();
        this.popupService.success('Idea Received!', 'Our engineering team has been notified of your request.');
        
        // Reset form
        this.showFeatureForm = false;
        this.featureData = { title: '', category: 'Dashboard', description: '' };
      },
      error: (err) => {
        this.popupService.closeLoading();
        console.error('Feature submission failed', err);
        
        // Fallback to mailto if API fails (as a safety measure)
        const email = 'noshahidevelopersinc@gmail.com';
        const subject = `[NIM Fallback] Feature Request: ${this.featureData.title}`;
        const body = `Description: ${this.featureData.description}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        this.popupService.error('Direct Submission Failed', 'We opened your email app as a fallback.');
        this.showFeatureForm = false;
      }
    });
  }

  openLiveChat() {
    // Already handled via SideNav condition
  }

  requestFeature() {
    this.openFeatureForm();
  }
}
