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
import Swal, { WavyAlert, WelcomeAccessPopup } from '../../../swal';

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
        
        const displayName = res.fullName || res.username || 'User';
        const role = res.roles?.[0] || 'Member';

        WelcomeAccessPopup(displayName, role).then((result) => {
          this.router.navigateByUrl(this.returnUrl);
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

        WavyAlert('Sign In Failed', errMsg, 'error').then((result) => {
           if (result.isConfirmed) {
             // Retry button clicked - prepare for retry
             this.isSubmitting = false;
             // Clear any existing errors and focus on email field
             this.errorMessage = '';
             // Re-enable form for retry
             this.signInForm.enable();
             setTimeout(() => {
               const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
               if (emailInput) {
                 emailInput.focus();
                 emailInput.select(); // Select text for easy editing
               }
             }, 300);
           } else if (result.isDismissed) {
             // Close button clicked - just stop submitting
             this.isSubmitting = false;
             this.errorMessage = '';
             // Re-enable form
             this.signInForm.enable();
           }
        });
      }
    });
  }

  // Optional: convenience getters for template validation
  get email() { return this.signInForm.get('email'); }
  get password() { return this.signInForm.get('password'); }
}


