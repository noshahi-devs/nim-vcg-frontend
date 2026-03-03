// import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { AuthService } from '../SecurityModels/auth.service';
// import { CommonModule, NgIf } from '@angular/common';
// import { AuthResponse } from '../SecurityModels/auth-response';

// @Component({
//   selector: 'app-sign-in',
//   templateUrl: './sign-in.component.html',
//   styleUrls: ['./sign-in.component.css'],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
//   imports: [ReactiveFormsModule, CommonModule, NgIf, FormsModule, CommonModule, RouterLink]
// })
// export class SignInComponent {

//   signInForm: FormGroup;
//   isSubmitting = false;
//   errorMessage = '';

//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     this.signInForm = this.fb.group({
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', Validators.required],
//       remember: [false]
//     });
//   }
// submit() {
//   if (this.signInForm.invalid) return;
//   this.isSubmitting = true;
//   this.errorMessage = '';

//     const payload = {
//       email: this.signInForm.value.email,
//       password: this.signInForm.value.password,
//     };

//   this.authService.login(payload).subscribe({
//     next: (res: AuthResponse) => {
//       console.log('Login success:', res);
//       this.authService.doLoginUser(res);
//       this.router.navigate(['/dashboard']);
//       this.isSubmitting = false;
//     },
//     error: (err) => {
//       console.error('Login failed:', err);
//       this.errorMessage = err.error?.message || 'Login failed';
//       this.isSubmitting = false;
//     }
//   });
// }


// }

import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AuthResponse } from '../../../SecurityModels/auth-response';
import { CommonModule, NgIf } from '@angular/common';
import Swal from '../../../swal';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, NgIf]
})
export class SignInComponent {
  signInForm: FormGroup;
  returnUrl: string = '/dashboard';
  errorMessage: string = '';
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });

    // Get returnUrl from query params if present
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  private getDisplayName(res: AuthResponse): string {
    if (res.fullName?.trim()) return res.fullName.trim();
    if (res.username?.trim()) return res.username.trim();
    if (res.email?.trim()) return res.email.split('@')[0];
    return 'User';
  }

  private getPrimaryRole(res: AuthResponse): string {
    return res.roles?.[0] || 'User';
  }

  private getDayGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  private launchFlowerBurst(popup: HTMLElement): void {
    const oldLayer = popup.querySelector('.login-flower-layer');
    if (oldLayer) oldLayer.remove();

    const layer = document.createElement('div');
    layer.className = 'login-flower-layer';

    const petalsCount = 18;
    for (let i = 0; i < petalsCount; i++) {
      const petal = document.createElement('span');
      petal.className = 'login-petal';

      const size = Math.floor(8 + Math.random() * 11);
      const startX = Math.floor(Math.random() * 100);
      const drift = Math.floor(-36 + Math.random() * 72);
      const delay = (Math.random() * 0.9).toFixed(2);
      const duration = (2.2 + Math.random() * 1.8).toFixed(2);
      const rotation = Math.floor(Math.random() * 320);

      petal.style.width = `${size}px`;
      petal.style.height = `${Math.floor(size * 1.3)}px`;
      petal.style.setProperty('--start-x', `${startX}%`);
      petal.style.setProperty('--petal-drift', `${drift}px`);
      petal.style.setProperty('--petal-delay', `${delay}s`);
      petal.style.setProperty('--petal-duration', `${duration}s`);
      petal.style.setProperty('--petal-rotation', `${rotation}deg`);

      layer.appendChild(petal);
    }

    const sparksCount = 12;
    for (let i = 0; i < sparksCount; i++) {
      const spark = document.createElement('span');
      spark.className = 'login-spark';
      spark.style.setProperty('--spark-x', `${Math.floor(20 + Math.random() * 60)}%`);
      spark.style.setProperty('--spark-y', `${Math.floor(20 + Math.random() * 50)}%`);
      spark.style.setProperty('--spark-delay', `${(Math.random() * 0.8).toFixed(2)}s`);
      spark.style.setProperty('--spark-duration', `${(1 + Math.random() * 1.2).toFixed(2)}s`);
      layer.appendChild(spark);
    }

    popup.appendChild(layer);
  }

  private bindWelcomeInteractivity(popup: HTMLElement): () => void {
    const card = popup.querySelector('.login-welcome-card') as HTMLElement | null;
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => {};
    }

    const onMove = (event: MouseEvent) => {
      const rect = popup.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 8;
      const rotateX = (0.5 - py) * 7;
      card.style.transform = `translateY(-1px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const onLeave = () => {
      card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
    };

    popup.addEventListener('mousemove', onMove);
    popup.addEventListener('mouseleave', onLeave);

    return () => {
      popup.removeEventListener('mousemove', onMove);
      popup.removeEventListener('mouseleave', onLeave);
      card.style.transform = '';
    };
  }

  private showWelcomePopup(res: AuthResponse): Promise<any> {
    const displayName = this.getDisplayName(res);
    const role = this.getPrimaryRole(res);
    const greeting = this.getDayGreeting();
    let unbindInteractions: (() => void) | null = null;

    return Swal.fire({
      title: `${greeting}, ${displayName}!`,
      html: `
        <div class="login-welcome-shell">
          <div class="login-welcome-ribbon">Session Active</div>
          <div class="login-welcome-card">
            <div class="login-welcome-hero">
              <div class="login-welcome-emblem">
                <iconify-icon icon="solar:verified-check-bold-duotone"></iconify-icon>
              </div>
              <div>
                <h4 class="login-welcome-subtitle">Access Granted</h4>
                <p class="login-welcome-message">Your secure session is ready. Continue to your workspace.</p>
              </div>
            </div>
            <div class="login-welcome-meta">
              <span class="login-chip"><strong>Role:</strong> ${role}</span>
              <span class="login-chip"><strong>Email:</strong> ${res.email || 'N/A'}</span>
            </div>
            <div class="login-welcome-note">
              <span class="login-pulse-dot"></span>
              Redirect will happen automatically in a few seconds.
            </div>
          </div>
        </div>
      `,
      icon: 'success',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: 'Enter Dashboard',
      cancelButtonText: 'Stay Here',
      timer: 8500,
      timerProgressBar: true,
      allowOutsideClick: false,
      didOpen: (popup) => {
        this.launchFlowerBurst(popup as HTMLElement);
        unbindInteractions = this.bindWelcomeInteractivity(popup as HTMLElement);
      },
      didClose: () => {
        if (unbindInteractions) unbindInteractions();
      },
      customClass: {
        popup: 'nim-swal-popup login-welcome-popup',
        title: 'nim-swal-title login-welcome-title',
        htmlContainer: 'nim-swal-html login-welcome-html',
        actions: 'nim-swal-actions',
        confirmButton: 'nim-swal-btn nim-swal-confirm',
        cancelButton: 'nim-swal-btn nim-swal-cancel',
        closeButton: 'nim-swal-close'
      }
    });
  }

  submit(): void {
    if (this.signInForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      email: this.signInForm.value.email,
      password: this.signInForm.value.password
    };

    this.authService.login(payload).subscribe({
      next: (res: AuthResponse) => {
        console.log('Login success:', res);

        this.showWelcomePopup(res).then((result) => {
          const shouldNavigate =
            result.isConfirmed ||
            (result.isDismissed && result.dismiss !== 'cancel');

          if (shouldNavigate) {
            this.router.navigateByUrl(this.returnUrl);
          }
        }).finally(() => {
          this.isSubmitting = false;
        });
      },

      error: (err) => {
        console.error('Login failed:', err);

        let errMsg = '';
        if (err.status === 401) {
          errMsg = 'Invalid email or password. Please try again.';
        } else if (err.status === 400) {
          errMsg = err.error?.message || 'Bad Request. Please check your inputs.';
        } else if (err.status === 404) {
          errMsg = 'Account not found. Please sign up first.';
        } else if (err.status === 500) {
          errMsg = 'Internal Server Error. Please contact support or try again later.';
        } else if (err.status === 0) {
          errMsg = 'Unable to connect to the server. Please check your internet connection.';
        } else {
          errMsg = err.error?.message || 'An unexpected error occurred during login.';
        }

        Swal.fire({
          title: 'Sign In Failed',
          text: errMsg,
          icon: 'error',
          confirmButtonText: 'Try Again'
        });

        this.isSubmitting = false;
      }
    });
  }

  // Optional: convenience getters for template validation
  get email() { return this.signInForm.get('email'); }
  get password() { return this.signInForm.get('password'); }
}


