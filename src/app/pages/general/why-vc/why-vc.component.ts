import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandingHeaderComponent } from '../branding-header/branding-header.component';
import { BrandingFooterComponent } from '../branding-footer/branding-footer.component';

@Component({
  selector: 'app-why-vc',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandingHeaderComponent, BrandingFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './why-vc.component.html',
  styleUrls: ['./why-vc.component.css']
})
export class WhyVcComponent {
  coreValues = [
    {
      title: 'Academic Excellence',
      icon: 'solar:medal-star-bold-duotone',
      description: 'We maintain the highest standards of education with a curriculum designed for the modern world.'
    },
    {
      title: 'Holistic Development',
      icon: 'solar:armchair-bold-duotone',
      description: 'Beyond books, we focus on character building, leadership, and emotional intelligence.'
    },
    {
      title: 'Global Outlook',
      icon: 'solar:globus-bold-duotone',
      description: 'Preparing students to compete and succeed in an increasingly interconnected global economy.'
    },
    {
      title: 'Faith & Ethics',
      icon: 'solar:heart-angle-bold-duotone',
      description: 'Grounding our students in strong moral values and ethical principles for a balanced life.'
    }
  ];

  stats = {
    results: '98%',
    scholarships: '500+',
    campusSize: '20+',
    faculty: '50+'
  };
}
