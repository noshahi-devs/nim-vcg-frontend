import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignUpComponent } from './sign-up.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../SecurityModels/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../../../SecurityModels/auth-response';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register']);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SignUpComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call register if form is invalid', () => {
    component.signUpForm.setValue({
      email: '',
      userName: '',
      password: '',
      role: 'Admin'
    });
    component.submit();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should call register and navigate on success', () => {
    const mockResponse: AuthResponse = {
      token: 'mock-token',
      email: 'new@example.com',
      username: 'newuser',
      roles: ['Admin']
    };
    authServiceSpy.register.and.returnValue(of(mockResponse));

    component.signUpForm.setValue({
      email: 'new@example.com',
      userName: 'newuser',
      password: 'password123',
      role: 'Admin'
    });

    component.submit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      role: ['Admin']
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/sign-in']);
  });

  it('should set error message on registration failure', () => {
    const errorResponse = { error: { errors: 'Email already exists' } };
    authServiceSpy.register.and.returnValue(throwError(() => errorResponse));

    component.signUpForm.setValue({
      email: 'existing@example.com',
      userName: 'existinguser',
      password: 'password123',
      role: 'Admin'
    });

    component.submit();

    expect(component.errorMessage).toBe('Email already exists');
    expect(component.isSubmitting).toBeFalse();
  });
});
