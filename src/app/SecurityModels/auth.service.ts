import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, EMPTY, Observable, switchMap, tap, throwError } from "rxjs";
import { AuthRequest } from "./auth-request";
import { AppRole, AppUser, AuthResponse } from "./auth-response";

const API_URL = "http://localhost:5257/api/users/";

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly JWT_USER = 'JWT_USER';

  private router = inject(Router);
  private http = inject(HttpClient);

  private userSubject = new BehaviorSubject<AuthResponse | null>(
    (() => {
      try {
        return JSON.parse(localStorage.getItem(this.JWT_USER) ?? 'null');
      } catch {
        return null;
      }
    })()
  );

  user$ = this.userSubject.asObservable();

  // ================= AUTH CORE =================

  get userValue(): AuthResponse | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    const token = localStorage.getItem(this.JWT_TOKEN);
    return !!token && !this.isTokenExpired(token);
  }

  login(payload: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}login`, payload)
      .pipe(tap(res => this.doLoginUser(res)));
  }

  register(payload: { email: string; username: string; password: string; role: string[] }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}register`, payload);
  }

  doLoginUser(data: AuthResponse) {
    if (!data?.token) return;
    this.storeJwtToken(data.token);
    this.storeUser(data);
    this.userSubject.next(data);
  }

  logout() {
    localStorage.clear();
    this.userSubject.next(null);
    this.router.navigate(['/sign-in']);
  }

  // ================= TOKEN =================

  private storeJwtToken(token: string) {
    localStorage.setItem(this.JWT_TOKEN, token);
  }

  private storeUser(user: AuthResponse) {
    localStorage.setItem(this.JWT_USER, JSON.stringify(user));
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // ================= 🔐 RBAC =================

  /** Current user roles as array */
  get roles(): string[] {
    return this.userValue?.roles ?? (this.getRolesFromToken() ? [this.getRolesFromToken()!] : []);
  }

  /** Permissions list */
  get permissions(): string[] {
    return this.userValue?.permissions ?? [];
  }

  /** Check if user has a specific role */
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  /** Check if user has any of the given roles */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.roles.includes(r));
  }

  /** Check if user has a specific permission */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  /** Fallback if role is inside JWT */
  private getRolesFromToken(): string | null {
    const token = localStorage.getItem(this.JWT_TOKEN);
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // payload.roles could be string[] or string
      if (Array.isArray(payload.roles)) return payload.roles[0] ?? null;
      return payload.role ?? null;
    } catch {
      return null;
    }
  }

  // ================= ROLES & USERS API =================

  getRoles(): Observable<AppRole[]> {
    return this.http.get<AppRole[]>(`${API_URL}GetRoles`);
  }

  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${API_URL}GetUsers`);
  }

  getUser(id: string): Observable<AppUser> {
    return this.http.get<AppUser>(`${API_URL}GetUser/${id}`);
  }

  userAssignRole(data: AppUser): Observable<any> {
    return this.http.post(`${API_URL}AssignRole`, data);
  }

  roleEntry(role: AppRole): Observable<any> {
    if (role.id) return this.http.put(`${API_URL}edit-role`, role);
    return this.http.post(`${API_URL}create-role`, role);
  }

  roleDelete(roleId: string): Observable<any> {
    return this.http.delete(`${API_URL}delete-role/${roleId}`);
  }
}
