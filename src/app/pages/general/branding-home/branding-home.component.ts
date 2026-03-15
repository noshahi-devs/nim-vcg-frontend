import { CommonModule } from '@angular/common';
import { Component, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrandingHeaderComponent } from '../branding-header/branding-header.component';
import { BrandingFooterComponent } from '../branding-footer/branding-footer.component';

@Component({
  selector: 'app-branding-home',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandingHeaderComponent, BrandingFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './branding-home.component.html',
  styleUrls: ['./branding-home.component.css']
})
export class BrandingHomeComponent {
  isMenuOpen = false;
  showBackToTop = false;

  // Stats Counters
  stats = {
    years: 0,
    scholars: 0,
    wifi: 0,
    faculty: 0
  };
  private statsStarted = false;

  // Carousel Logic
  currentSlide = 0;
  currentTestimonial = 0;
  currentStaff = 0;
  testimonialIndices = [0, 1, 2];
  staffIndices = [0, 1, 2, 3]; // Adjust based on how many "pages" or groups you want
  slides = [
    {
      image: 'assets/img/serene-campus.png',
      featureImage: 'assets/img/vision_logo.png',
      eyebrow: 'Our Visionary Campus',
      title: 'Empowering\nFuture Leaders',
      description: 'Experience a sanctuary of learning in the heart of Gojra, where academic excellence meets spiritual growth.'
    },
    {
      image: 'assets/img/serene-lab.png',
      featureImage: 'assets/img/carousel-lab.png',
      eyebrow: 'Future-Ready Labs',
      title: 'Innovation Meets\nModern Tech',
      description: 'Unlock your potential in our modern laboratories designed to inspire the next generation of scientists.'
    },
    {
      image: 'assets/img/serene-library.png',
      featureImage: 'assets/img/carousel-lib.png',
      eyebrow: 'Serene Study Spaces',
      title: 'A Sanctuary for\nKnowledge',
      description: 'Discover peace and focus in our light-filled library, housing thousands of resources for your academic journey.'
    }
  ];

  private autoPlayInterval: any;

  ngOnInit(): void {
    this.startAutoPlay();
    this.setupIntersectionObserver();
    this.startTestimonialAutoSlide();
    this.startStaffAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showBackToTop = window.scrollY > 300;
  }

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMenuOpen = false;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Carousel Methods
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.resetAutoPlay();
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.resetAutoPlay();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.resetAutoPlay();
  }

  private startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  private resetAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  // Stats Animation Logic
  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.statsStarted) {
          this.animateStats();
          this.statsStarted = true;
          observer.unobserve(entry.target);
        }
      });
    }, options);

    const statsSection = document.querySelector('.hero-stats-overlay');
    if (statsSection) {
      observer.observe(statsSection);
    }
  }

  private animateStats(): void {
    this.animateValue('years', 0, 18, 2000);
    this.animateValue('scholars', 0, 3000, 2500);
    this.animateValue('wifi', 0, 100, 2000);
    this.animateValue('faculty', 0, 150, 2200);
  }

  private animateValue(key: keyof typeof this.stats, start: number, end: number, duration: number): void {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      this.stats[key] = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // --- Testimonials Slider Logic ---
  startTestimonialAutoSlide(): void {
    setInterval(() => {
      this.nextTestimonial();
    }, 8000);
  }

  nextTestimonial(): void {
    this.currentTestimonial = (this.currentTestimonial + 1) % 3;
  }

  prevTestimonial(): void {
    this.currentTestimonial = (this.currentTestimonial - 1 + 3) % 3;
  }

  setTestimonial(index: number): void {
    this.currentTestimonial = index;
  }

  // --- Staff Slider Logic ---
  startStaffAutoSlide(): void {
    setInterval(() => {
      this.nextStaff();
    }, 10000);
  }

  nextStaff(): void {
    this.currentStaff = (this.currentStaff + 1) % 2; // Fixed to 2 slides
  }

  prevStaff(): void {
    this.currentStaff = (this.currentStaff - 1 + 2) % 2;
  }

  setStaff(index: number): void {
    this.currentStaff = index;
  }
}
