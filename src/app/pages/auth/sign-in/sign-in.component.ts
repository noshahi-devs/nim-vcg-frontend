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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AuthResponse } from '../../../SecurityModels/auth-response';
import { CommonModule, NgIf } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, NgIf, RouterLink]
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

        // Token will be saved by doLoginUser
        this.authService.doLoginUser(res);

        // --- PREMIUM WELCOME POPUP ---
        Swal.fire({
          title: `Welcome back, ${res.username || 'User'}!`,
          text: 'You have logged in successfully.',
          icon: 'success',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#6366f1',
          customClass: {
            popup: 'premium-swal-popup',
            title: 'premium-swal-title',
            timerProgressBar: 'premium-swal-progress'
          },
          showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutDown animate__faster'
          }
        }).then(() => {
          this.router.navigateByUrl(this.returnUrl);
        });

        this.isSubmitting = false;
      },

      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage = err.error?.message || 'Login failed';
        this.isSubmitting = false;
      }
    });
  }

  // Optional: convenience getters for template validation
  get email() { return this.signInForm.get('email'); }
  get password() { return this.signInForm.get('password'); }
}
