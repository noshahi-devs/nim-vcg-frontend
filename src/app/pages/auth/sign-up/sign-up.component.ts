// import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { Router, RouterLink } from "@angular/router";
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
// import { AuthService } from '../SecurityModels/auth.service';

// @Component({
//   selector: 'app-sign-up',
//   standalone: true,
//   imports: [RouterLink, ReactiveFormsModule],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
//   templateUrl: './sign-up.component.html',
//   styleUrl: './sign-up.component.css'
// })
// export class SignUpComponent {
//   title = 'Sign Up';

//   signupForm!: FormGroup;
// form: FormGroup<any>;

//   constructor(
//     private fb: FormBuilder,
//     private auth: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.signupForm = this.fb.group({
//       username: ['', Validators.required],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', Validators.required],
//       role: ['', Validators.required]
//     });
//   }

//   onSubmit() {
//     if (this.signupForm.invalid) return;

//     this.auth.register(this.signupForm.value).subscribe({
//       next: (res) => {
//         const role = this.signupForm.value.role;

//         switch (role) {
//           case 'admin':
//             this.router.navigate(['/admin/dashboard']);
//             break;

//           case 'principal':
//             this.router.navigate(['/principal/dashboard']);
//             break;

//           case 'teacher':
//             this.router.navigate(['/teacher/dashboard']);
//             break;

//           case 'student':
//             this.router.navigate(['/student/dashboard']);
//             break;
//         }
//       },
//       error: (err) => {
//         console.error('Error:', err);
//       }
//     });
//   }
// }


import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../SecurityModels/auth.service';
import { Router, RouterLink } from '@angular/router';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ReactiveFormsModule, RouterLink, CommonModule]
})
export class SignUpComponent {
  signUpForm: FormGroup;
  roles: string[] = ['Admin', 'Teacher', 'Student']; // example roles from backend
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      userName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [this.roles[0], Validators.required]  // default role
    });
  }

  submit() {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      email: this.signUpForm.value.email,
      username: this.signUpForm.value.userName, // lowercase
      password: this.signUpForm.value.password,
      role: [this.signUpForm.value.role]        // array
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        console.log('Registration successful', res);
        this.isSubmitting = false;
        // Redirect to sign-in page
        this.router.navigate(['/sign-in']);

      },
      error: (err) => {
        console.error('Registration error:', err);
        this.isSubmitting = false;
        this.errorMessage = err.error?.errors || 'Something went wrong. Please try again.';
      }
    });
  }

}

