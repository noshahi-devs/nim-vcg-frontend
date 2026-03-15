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

import { Component, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
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
  imports: [ReactiveFormsModule, FormsModule, CommonModule]
})
export class SignInComponent implements AfterViewInit, OnDestroy {
  signInForm: FormGroup;
  returnUrl: string = '/dashboard';
  errorMessage: string = '';
  isSubmitting: boolean = false;

  // Particle System Variables
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId!: number;
  private particleCount = 120; // High density for Windsurf feel

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

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.initParticleSystem();
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.particles = [];
      this.initParticles();
    }
  }

  private initParticleSystem(): void {
    this.canvas = document.getElementById('windsurf-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.initParticles();
    this.animate();
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
        this.particles.push(new Particle(this.canvas.width, this.canvas.height));
    }
  }

  private animate(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Background Glow Layer (Ambient)
    const gradient = this.ctx.createRadialGradient(
        this.canvas.width / 2, this.canvas.height / 2, 0,
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
    );
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Particles & Connections
    for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].update();
        this.particles[i].draw(this.ctx);
        
        // Connect nearby particles
        for (let j = i + 1; j < this.particles.length; j++) {
            const dx = this.particles[i].x - this.particles[j].x;
            const dy = this.particles[i].y - this.particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 150})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                this.ctx.stroke();
            }
        }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
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
             this.isSubmitting = false;
             this.errorMessage = '';
             this.signInForm.enable();
             setTimeout(() => {
               const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
               if (emailInput) {
                 emailInput.focus();
                 emailInput.select();
               }
             }, 300);
           } else if (result.isDismissed) {
             this.isSubmitting = false;
             this.errorMessage = '';
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

// Internal Particle Helper Class
class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.width;
        this.y = Math.random() * this.height;
        this.size = Math.random() * 2.5 + 1;
        this.speedX = (Math.random() - 0.5) * 1.5; // Increased speed for "feel like they move"
        this.speedY = (Math.random() - 0.5) * 1.5; // Increased speed for "feel like they move"
        this.opacity = Math.random() * 0.6 + 0.3;
        
        // Vibrant mesh palette: Golden Yellow, Cyan, Blue, Purple
        const colors = [
          'rgba(244, 196, 48', // Golden Yellow
          'rgba(6, 182, 212',  // Cyan
          'rgba(59, 130, 246', // Blue
          'rgba(168, 85, 247'  // Purple
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges with a slight dampening
        if (this.x < 0 || this.x > this.width) {
            this.speedX *= -1;
            this.x = Math.max(0, Math.min(this.x, this.width));
        }
        if (this.y < 0 || this.y > this.height) {
            this.speedY *= -1;
            this.y = Math.max(0, Math.min(this.y, this.height));
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}, ${this.opacity})`;
        ctx.fill();
        
        // Add subtle glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = `${this.color}, 0.6)`;
    }
}



