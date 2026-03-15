import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandingHeaderComponent } from '../branding-header/branding-header.component';
import { BrandingFooterComponent } from '../branding-footer/branding-footer.component';

@Component({
  selector: 'app-campus-life',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandingHeaderComponent, BrandingFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './campus-life.component.html',
  styleUrls: ['./campus-life.component.css']
})
export class CampusLifeComponent {
  galleryItems = [
    { image: 'assets/img/Campus1.jpeg', title: 'Main Entrance', category: 'Campus' },
    { image: 'assets/img/Campus2.jpeg', title: 'Student Lawns', category: 'Leisure' },
    { image: 'assets/img/Campus3.jpeg', title: 'Modern Classrooms', category: 'Academic' },
    { image: 'assets/img/Campus4.jpeg', title: 'Digital Library', category: 'Academic' },
    { image: 'assets/img/Campus5.jpeg', title: 'Sports Ground', category: 'Sports' },
    { image: 'assets/img/Campus.jpeg', title: 'Evening View', category: 'Campus' }
  ];

  activities = [
    {
      title: 'Sports & Athletics',
      icon: 'solar:medal-ribbon-bold-duotone',
      description: 'Regular tournaments in cricket, football, and badminton to foster team spirit.'
    },
    {
      title: 'Science & Robotics',
      icon: 'solar:atom-bold-duotone',
      description: 'Hands-on experimentation in our state-of-the-art labs and innovation hubs.'
    },
    {
      title: 'Arts & Culture',
      icon: 'solar:palette-bold-duotone',
      description: 'Annual drama festivals, debaing competitions, and creative writing workshops.'
    }
  ];
}
