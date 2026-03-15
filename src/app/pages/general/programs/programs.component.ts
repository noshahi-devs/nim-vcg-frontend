import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandingHeaderComponent } from '../branding-header/branding-header.component';
import { BrandingFooterComponent } from '../branding-footer/branding-footer.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandingHeaderComponent, BrandingFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.css']
})
export class ProgramsComponent {
  currentCategory: string = 'all';

  programs = [
    {
      id: 'matric',
      category: 'matric',
      title: 'Matriculation',
      subtitle: 'Foundation for Excellence',
      description: 'A comprehensive curriculum designed to build a strong scientific and analytical foundation for young scholars.',
      features: ['Modern Science Labs', 'Professional STEM Clubs', 'Olympiad Preparation', 'Personalized Mentorship'],
      icon: 'solar:book-bookmark-bold-duotone'
    },
    {
      id: 'intermediate-medical',
      category: 'inter',
      title: 'FSc Pre-Medical',
      subtitle: 'Path to Medical Brilliance',
      description: 'Dedicated training for aspiring doctors and medical researchers with advanced biology and chemistry workshops.',
      features: ['MCAT Focused Prep', 'Hospital Observations', 'Research Workshops', 'Elite Faculty'],
      icon: 'solar:heart-pulse-bold-duotone'
    },
    {
      id: 'intermediate-engineering',
      category: 'inter',
      title: 'FSc Pre-Engineering',
      subtitle: 'Engineering the Future',
      description: 'Intensive focus on physics, mathematics, and logic to prepare students for top-tier engineering universities.',
      features: ['ECAT Targeted Sessions', 'Robotics Innovation Lab', 'Physics Lab Exposure', 'Mathematical Modeling'],
      icon: 'solar:settings-bold-duotone'
    },
    {
      id: 'intermediate-ics',
      category: 'inter',
      title: 'ICS (Computer Science)',
      subtitle: 'The Digital Frontier',
      description: 'Empowering students with coding, software logic, and computational thinking for the modern digital era.',
      features: ['Full-Stack Bootcamp', 'Cyber Security Intro', 'AI & Machine Learning', 'App Development'],
      icon: 'solar:laptop-minimalistic-bold-duotone'
    },
    {
      id: 'undergrad-cs',
      category: 'undergrad',
      title: 'BS Computer Science',
      subtitle: 'Industry-Ready Professionals',
      description: 'A higher-education degree focused on software engineering, data science, and innovative digital solutions.',
      features: ['Industry Internships', 'Startup Incubation', 'Software Design Lab', 'Capstone Projects'],
      icon: 'solar:code-bold-duotone'
    },
    {
      id: 'undergrad-business',
      category: 'undergrad',
      title: 'BS Business Administration',
      subtitle: 'Global Leadership',
      description: 'Developing the next generation of business leaders with a focus on entrepreneurship and management.',
      features: ['Case Study Methods', 'Corporate Networking', 'Financial Modeling', 'Leadership Seminars'],
      icon: 'solar:graph-up-bold-duotone'
    }
  ];

  get filteredPrograms() {
    if (this.currentCategory === 'all') return this.programs;
    return this.programs.filter(p => p.category === this.currentCategory);
  }

  setCategory(cat: string) {
    this.currentCategory = cat;
  }
}
