import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignInComponent } from './sign-in.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../SecurityModels/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../../../SecurityModels/auth-response';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login', 'doLoginUser']);
    const rSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [SignInComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: { returnUrl: '/dashboard' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call login if form is invalid', () => {
    component.signInForm.setValue({ email: '', password: '', remember: false });
    component.submit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call login and doLoginUser on success', () => {
    const mockResponse: AuthResponse = {
      token: 'mock-token',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['Admin']
    };
    authServiceSpy.login.and.returnValue(of(mockResponse));

    component.signInForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      remember: false
    });

    component.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(authServiceSpy.doLoginUser).toHaveBeenCalledWith(mockResponse);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should set error message on login failure', () => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));

    component.signInForm.setValue({
      email: 'test@example.com',
      password: 'wrongpassword',
      remember: false
    });

    component.submit();

    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isSubmitting).toBeFalse();
  });
});
