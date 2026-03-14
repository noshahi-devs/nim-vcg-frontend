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
      image: 'assets/img/vision-building.jpeg',
      featureImage: 'assets/img/vision_logo.png', // Temporary, will use actual assets or icons
      eyebrow: 'Welcome to Vision College',
      title: 'Empowering Future Leaders \nWith a Single Vision',
      description: 'A modern campus in the heart of Gojra offering Matric, Intermediate, and Undergraduate paths.'
    },
    {
      image: 'assets/img/carousel-lab.png',
      featureImage: 'assets/img/ai-lab.jpg',
      eyebrow: 'Advanced Learning',
      title: 'State-of-the-Art \nScience & Tech Labs',
      description: 'Hands-on experience with modern equipment and expert faculty guidance for the future.'
    },
    {
      image: 'assets/img/carousel-lib.png',
      featureImage: 'assets/img/study.jpg',
      eyebrow: 'Resource Rich',
      title: 'Hub for Research \n& Digital Discovery',
      description: 'Explore thousands of resources in our modern library and digital lounge for deep focus.'
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
