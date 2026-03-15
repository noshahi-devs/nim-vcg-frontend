import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './branding-header.component.html',
  styleUrls: ['./branding-header.component.css']
})
export class BrandingHeaderComponent {
  isMenuOpen = false;
  isSticky = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isSticky = window.scrollY > 50;
  }

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMenuOpen = false;
  }
}
