import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandingHeaderComponent } from '../branding-header/branding-header.component';
import { BrandingFooterComponent } from '../branding-footer/branding-footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandingHeaderComponent, BrandingFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  // Simple form state
  formSubmitted = false;

  submitForm(event: Event): void {
    event.preventDefault();
    this.formSubmitted = true;
    // In a real app, you'd handle form submission here
    setTimeout(() => {
      this.formSubmitted = false;
    }, 5000);
  }
}
