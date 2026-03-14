import { CommonModule } from '@angular/common';
import { Component, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './branding-home.component.html',
  styleUrls: ['./branding-home.component.css']
})
export class BrandingHomeComponent {
  isMenuOpen = false;
  showBackToTop = false;

  // Carousel Logic
  currentSlide = 0;
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
}
