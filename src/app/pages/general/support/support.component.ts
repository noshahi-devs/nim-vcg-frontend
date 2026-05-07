import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  // AI Chatbot
  showChat = false;
  chatInput = '';
  chatMessages: { text: string, type: 'user' | 'ai' }[] = [
    { text: 'Hello! I am your AI Assistant. How can I help you today?', type: 'ai' }
  ];

  openFeatureForm() {
    this.showFeatureForm = true;
  }

  closeFeatureForm() {
    this.showFeatureForm = false;
  }

  submitFeature() {
    console.log('Feature Request Submitted:', this.featureData);
    alert('Thank you! Your feature request has been submitted to our engineering team.');
    this.showFeatureForm = false;
    this.featureData = { title: '', category: 'Dashboard', description: '' };
  }

  openLiveChat() {
    // This can be wired to the global chatbot if needed
  }

  requestFeature() {
    this.openFeatureForm();
  }
}
