import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-branding-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './branding-home.component.html',
  styleUrl: './branding-home.component.css'
})
export class BrandingHomeComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  showBackToTop = false;

  currentSlide = 0;
  private sliderInterval?: any;

  ngOnInit(): void {
    // Basic hero slider rotation (2 slides)
    this.sliderInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % 2;
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  toggleDropdown(event: Event): void {
    const btn = event.currentTarget as HTMLElement;
    const dropdown = btn.nextElementSibling as HTMLElement;
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
  }
}
