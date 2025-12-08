// import { HttpClient } from "@angular/common/http";
// import { Injectable, inject } from "@angular/core";
// import { Router } from "@angular/router";
// import { BehaviorSubject, EMPTY, Observable, tap } from "rxjs";
// import { AuthRequest } from "./auth-request";
// import { AppRole, AppUser, AuthResponse } from "./auth-response";
// import { jwtDecode } from "jwt-decode";
// import { RegistrationRequest } from "./RegistrationRequest";
// import { AuthRegRequest } from "./AuthRegRequest";

// const api: string = "https://localhost:7225/api/users/";

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private readonly JWT_TOKEN = 'JWT_TOKEN';
//   private readonly JWT_USER = 'JWT_USER';
//   private loggedUser?: string;
//   private router = inject(Router);
//   private http = inject(HttpClient);
//   private isLogin: boolean = false;

//   private userSubject: BehaviorSubject<AuthResponse | null> = new BehaviorSubject(JSON.parse(localStorage.getItem(this.JWT_USER)!));
//   public user: Observable<AuthResponse | null> = this.userSubject.asObservable();

//   //constructor(@Inject(ChangeDetectorRef) private changeDetectorRef: ChangeDetectorRef) { }


//   //constructor(private changeDetectorRef: ChangeDetectorRef) { }
//   constructor(
//   ) {
//     this.userSubject = new BehaviorSubject(JSON.parse(localStorage.getItem(this.JWT_USER)!));
//     this.user = this.userSubject.asObservable();
//   }

//   public get userValue() {
//     return this.userSubject.value;
//   }


//   // login(user: AuthRequest): Observable<AuthResponse> {
//   //   return this.http
//   //     .post<AuthResponse>(api + 'login', user)
//   //     .pipe(
//   //       tap((response: AuthResponse) => {
//   //         console.info(response);
//   //         this.doLoginUser(response);
//   //         //this.changeDetectorRef.detectChanges();
//   //         //this.router.navigate(['/']);
//   //         //this.router.navigate(['']);

//   //         this.userSubject.next(response);
//   //       })
//   //     );
//   // }

//   // register(userNew: AuthRegRequest): Observable<any> {
//   //   return this.http
//   //     .post(api + 'register', userNew);
//   // }
// login(user: AuthRequest): Observable<AuthResponse> {
//     return this.http.post<AuthResponse>(`https://localhost:7225/api/users/login`, user)
//       .pipe(
//         tap((res: AuthResponse) => this.doLoginUser(res)) // store JWT & user automatically
//       );
//   }


//   register(payload: any): Observable<any> {
//   return this.http.post('https://localhost:7225/api/Users/register', payload);
   
// }

//   roleEntry(role: AppRole): Observable<any> {

//     if (role.id) {
//       return this.http
//         .put(api + 'edit-role', role);
//     }
//     else {
//       return this.http
//         .post(api + 'create-role', role);
//     }

//   }
//   roleDelete(roleId: string): Observable<any> {

//     return this.http
//       .delete(api + 'delete-role/' + roleId);

//   }
//   // private doLoginUser(data: AuthResponse) {
//   //   this.loggedUser = data.email;
//   //   this.storeJwtToken(data.token);
//   //   this.storeUser(data);
//   // }
// public doLoginUser(data: AuthResponse) { // ✅
//   this.loggedUser = data.email;
//   this.storeJwtToken(data.token);
//   this.storeUser(data);
//   this.userSubject.next(data);
// }

//   private storeUser(user: AuthResponse) {
//     localStorage.setItem(this.JWT_USER, JSON.stringify(user));
//   }
//   private storeJwtToken(jwt: string) {
//     localStorage.setItem(this.JWT_TOKEN, jwt);
//   }

//   logout() {
//     localStorage.removeItem(this.JWT_TOKEN);
//     localStorage.removeItem(this.JWT_USER);
//     this.userSubject.next(null);
//     //this.router.navigate(['/login']);
//     window.location.href = '/login';
//   }

//   get getCurrentAuthUser(): any {
//     if (localStorage.getItem(this.JWT_USER)) {
//       var user = JSON.parse(localStorage.getItem(this.JWT_USER) ?? "");
//       return user;
//     }
//     return null;
//   }

//   //get isLoggedIn() {
//   //  return this.isAuthenticatedSubject.asObservable() || !!localStorage.getItem(this.JWT_TOKEN);
//   //}

//   get isLoggedIn() {
//     //this.isAuthenticatedSubject.asObservable().subscribe(data => {
//     //  this.isLogin = data;
//     //});

//     //this.user.subscribe(x => this.user = x);
//     return !!localStorage.getItem(this.JWT_TOKEN);
//   }




// isTokenExpired(): boolean {
//   const rawToken = localStorage.getItem(this.JWT_TOKEN);

//   if (!rawToken) {
//     return true;
//   }

//   let parsed: any;

//   try {
//     parsed = JSON.parse(rawToken);
//   } catch {
//     return true;
//   }

//   const token = parsed;
//   const decoded: any = jwtDecode(token);

//   if (!decoded?.exp) {
//     return true;
//   }

//   const expiry = decoded.exp * 1000;
//   return Date.now() > expiry;
// }


// // refreshToken(): Observable<any> { 
// //   let tokens: any = localStorage.getItem(this.JWT_TOKEN);

// //   if (!tokens) {
// //     return EMPTY;  // ✔️ Always return Observable
// //   }

// //   tokens = JSON.parse(tokens);
// //   let refreshToken = tokens.refresh_token;

// //   return this.http
// //     .post<any>('https://api.escuelajs.co/api/v1/auth/refresh-token', {
// //       refreshToken,
// //     })
// //     .pipe(tap((newTokens: any) => this.storeJwtToken(JSON.stringify(newTokens))));
// // }

// refreshToken(): Observable<any> {
//   const token = localStorage.getItem(this.JWT_TOKEN);

//   // If no token exists, return EMPTY observable
//   if (!token) {
//     return EMPTY;
//   }

//   let refreshToken: string;

//   try {
//     const decoded: any = jwtDecode(token);
//     refreshToken = decoded?.refresh_token;
//   } catch {
//     return EMPTY;
//   }

//   if (!refreshToken) {
//     return EMPTY;
//   }

//   return this.http
//     .post<any>('https://api.escuelajs.co/api/v1/auth/refresh-token', {
//       refreshToken,
//     })
//     .pipe(
//       tap(newTokens => {
//         localStorage.setItem(this.JWT_TOKEN, newTokens.token);
//       })
//     );
// }

//   users(): Observable<AppUser[]> {
//     return this.http
//       .get<AppUser[]>('https://localhost:7225/GetUsers');
//   }


//   roles(): Observable<AppRole[]> {
//     return this.http
//       .get<AppRole[]>('https://localhost:7225/GetRoles');
//   }
//   getUser(id: string): Observable<AppUser> {
//     return this.http
//       .get<AppUser>(api + "GetUser/" + id);
//   }

//   userAssignRole(data: AppUser): Observable<any> {
//     return this.http
//       .post(api + 'AssignRole', data);
//   }

// }



// import { HttpClient } from "@angular/common/http";
// import { Injectable, inject } from "@angular/core";
// import { Router } from "@angular/router";
// import { BehaviorSubject, EMPTY, Observable, tap } from "rxjs";
// import { AuthRequest } from "./auth-request";
// import { AppRole, AppUser, AuthResponse } from "./auth-response";

// const API_URL = "https://localhost:7225/api/users/";

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private readonly JWT_TOKEN = 'JWT_TOKEN';
//   private readonly JWT_USER = 'JWT_USER';

//   private router = inject(Router);
//   private http = inject(HttpClient);

//   // private userSubject: BehaviorSubject<AuthResponse | null> = new BehaviorSubject<AuthResponse | null>(
//   //   JSON.parse(localStorage.getItem(this.JWT_USER) ?? 'null')
//   // );
// private userSubject: BehaviorSubject<AuthResponse | null> = new BehaviorSubject<AuthResponse | null>(
//   (() => {
//     try { return JSON.parse(localStorage.getItem(this.JWT_USER) ?? 'null'); } 
//     catch { return null; }
//   })()
// );


//   public user: Observable<AuthResponse | null> = this.userSubject.asObservable();

//   constructor() {}

//   // Get current logged-in user
//   public get userValue(): AuthResponse | null {
//     return this.userSubject.value;
//   }

//   // Login method
//   login(payload: AuthRequest): Observable<AuthResponse> {
//     return this.http.post<AuthResponse>('https://localhost:7225/api/users/login', payload)
//       .pipe(
//         tap(res => this.doLoginUser(res)) // store JWT & user manually
//       );
//   }

//   // Public method to store JWT and user
//   public doLoginUser(data: AuthResponse) {
//     if (!data || !data.token) {
//       console.error("Invalid login response", data);
//       return;
//     }
//     this.storeJwtToken(data.token);
//     this.storeUser(data);
//     this.userSubject.next(data);
//   }

//   // Register user
//   register(payload: any): Observable<any> {
//     return this.http.post(`${API_URL}register`, payload);
//   }

//   // Logout
//   logout() {
//   localStorage.removeItem(this.JWT_TOKEN);
//   localStorage.removeItem(this.JWT_USER);
//   this.userSubject.next(null);
//   this.router.navigate(['/sign-in']);
// }


//   // Check if user is logged in
//  get isLoggedIn(): boolean {
//   return !!localStorage.getItem(this.JWT_TOKEN) && !this.isTokenExpired();
// }

//   // Store JWT token
//   private storeJwtToken(token: string) {
//     localStorage.setItem(this.JWT_TOKEN, token);
//   }

//   // Store user
//   private storeUser(user: AuthResponse) {
//     localStorage.setItem(this.JWT_USER, JSON.stringify(user));
//   }

//   // Check if token is expired
//   // isTokenExpired(): boolean {
//   //   const token = localStorage.getItem(this.JWT_TOKEN);
//   //   if (!token) return true;

//   //   try {
//   //     const decoded: any = jwtDecode(token);
//   //     if (!decoded?.exp) return true;
//   //     return Date.now() > decoded.exp * 1000;
//   //   } catch (err) {
//   //     console.error("Invalid token", err);
//   //     return true;
//   //   }
//   // }
// isTokenExpired(token?: string): boolean {
//   if (!token) {
//     console.error("Token is missing");
//     return true; // treat as expired
//   }

//   try {
//     const decoded: any = this.jwtDecode(token);
//     const exp = decoded.exp;
//     if (!exp) return true; // no expiration
//     return Date.now() >= exp * 1000; // exp is in seconds
//   } catch (error) {
//     console.error("Invalid token Error:", error);
//     return true;
//   }
// }
//   jwtDecode(token: string): any {
//     throw new Error("Method not implemented.");
//   }




//   // Refresh token (if needed)
//   refreshToken(): Observable<any> {
//     const token = localStorage.getItem(this.JWT_TOKEN);
//     if (!token) return EMPTY;

//     try {
//       const decoded: any = jwtDecode(token);
//       const refreshToken = decoded?.refresh_token;
//       if (!refreshToken) return EMPTY;

//       return this.http.post<any>('https://api.escuelajs.co/api/v1/auth/refresh-token', { refreshToken })
//         .pipe(tap(newTokens => this.storeJwtToken(newTokens.token)));
//     } catch {
//       return EMPTY;
//     }
//   }

//   // Roles & Users API methods
//   roles(): Observable<AppRole[]> {
//     return this.http.get<AppRole[]>(`${API_URL}GetRoles`);
//   }

//   users(): Observable<AppUser[]> {
//     return this.http.get<AppUser[]>(`${API_URL}GetUsers`);
//   }

//   getUser(id: string): Observable<AppUser> {
//     return this.http.get<AppUser>(`${API_URL}GetUser/${id}`);
//   }

//   userAssignRole(data: AppUser): Observable<any> {
//     return this.http.post(`${API_URL}AssignRole`, data);
//   }

//   roleEntry(role: AppRole): Observable<any> {
//     if (role.id) return this.http.put(`${API_URL}edit-role`, role);
//     return this.http.post(`${API_URL}create-role`, role);
//   }

//   roleDelete(roleId: string): Observable<any> {
//     return this.http.delete(`${API_URL}delete-role/${roleId}`);
//   }
// }
// function jwtDecode(token: string): any {
//   throw new Error("Function not implemented.");
// }



import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, EMPTY, Observable, switchMap, tap, throwError } from "rxjs";
import { AuthRequest } from "./auth-request";
import { AppRole, AppUser, AuthResponse } from "./auth-response";

const API_URL = "https://localhost:7225/api/users/";

@Injectable({ providedIn: 'root' })
export class AuthService {
  static isLoggedIn() {
    throw new Error('Method not implemented.');
  }
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly JWT_USER = 'JWT_USER';

  private router = inject(Router);
  private http = inject(HttpClient);

  private userSubject: BehaviorSubject<AuthResponse | null> = new BehaviorSubject<AuthResponse | null>(
    (() => {
      try { return JSON.parse(localStorage.getItem(this.JWT_USER) ?? 'null'); } 
      catch { return null; }
    })()
  );

  public user: Observable<AuthResponse | null> = this.userSubject.asObservable();
  api: any;

  get userValue(): AuthResponse | null {
    return this.userSubject.value;
  }

  // ---------------- LOGIN & REGISTER ----------------
  login(payload: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}login`, payload)
      .pipe(tap(res => this.doLoginUser(res)));
  }

  doLoginUser(data: AuthResponse) {
    if (!data || !data.token) return;
    this.storeJwtToken(data.token);
    this.storeUser(data);
    this.userSubject.next(data);
  }

  register(payload: any): Observable<any> {
    return this.http.post(`${API_URL}register`, payload);
  }

  logout() {
    localStorage.removeItem(this.JWT_TOKEN);
    localStorage.removeItem(this.JWT_USER);
    this.userSubject.next(null);
    this.router.navigate(['/sign-in']);
  }

  get isLoggedIn(): boolean {
    const token = localStorage.getItem(this.JWT_TOKEN);
    return !!token && !this.isTokenExpired(token);
  }

  // ---------------- TOKEN ----------------
  private storeJwtToken(token: string) {
    localStorage.setItem(this.JWT_TOKEN, token);
  }

  private storeUser(user: AuthResponse) {
    localStorage.setItem(this.JWT_USER, JSON.stringify(user));
  }

  // isTokenExpired(token: string): boolean {
  //   if (!token) return true;
  //   try {
  //     const decoded: any = jwt_decode(token);
  //     const exp = decoded.exp;
  //     return exp ? Date.now() >= exp * 1000 : false;
  //   } catch (error) {
  //     console.error('Invalid token', error);
  //     return true;
  //   }
  // }
isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true; // any error = token invalid
  }
}



  // refreshToken(): Observable<any> {
  //   const token = localStorage.getItem(this.JWT_TOKEN);
  //   if (!token) return EMPTY;

  //   try {
  //     const decoded: any = jwt_decode(token);
  //     const refreshToken = decoded?.refresh_token;
  //     if (!refreshToken) return EMPTY;

  //     return this.http.post<any>(`${API_URL}refresh-token`, { refreshToken })
  //       .pipe(tap(newTokens => this.storeJwtToken(newTokens.token)));
  //   } catch (error) {
  //     console.error("Refresh token error", error);
  //     return EMPTY;
  //   }
  // }
  refreshToken() {
  const refresh = localStorage.getItem('REFRESH_TOKEN');
  if (!refresh) return throwError(() => 'No refresh token');

  return this.http.post<AuthResponse>(`${this.api}/refresh`, { refreshToken: refresh })
    .pipe(
      tap(res => this.doLoginUser(res))
    );
}


  // ---------------- AUTO REFRESH ----------------
  requestWithToken<T>(apiCall: () => Observable<T>): Observable<T> {
    const token = localStorage.getItem(this.JWT_TOKEN);

    if (!token || this.isTokenExpired(token)) {
      return this.refreshToken().pipe(
        switchMap(() => apiCall()),
        // if refresh fails
        switchMap(result => result ? [result] : throwError(() => new Error('Token refresh failed')))
      );
    }
    return apiCall();
  }

  // ---------------- ROLES & USERS ----------------
  roles(): Observable<AppRole[]> {
    return this.requestWithToken(() => this.http.get<AppRole[]>(`${API_URL}GetRoles`));
  }

  users(): Observable<AppUser[]> {
    return this.requestWithToken(() => this.http.get<AppUser[]>(`${API_URL}GetUsers`));
  }

  getUser(id: string): Observable<AppUser> {
    return this.requestWithToken(() => this.http.get<AppUser>(`${API_URL}GetUser/${id}`));
  }

  userAssignRole(data: AppUser): Observable<any> {
    return this.requestWithToken(() => this.http.post(`${API_URL}AssignRole`, data));
  }

  roleEntry(role: AppRole): Observable<any> {
    return this.requestWithToken(() =>
      role.id ? this.http.put(`${API_URL}edit-role`, role) : this.http.post(`${API_URL}create-role`, role)
    );
  }

  roleDelete(roleId: string): Observable<any> {
    return this.requestWithToken(() => this.http.delete(`${API_URL}delete-role/${roleId}`));
  }
}
function jwt_decode(token: string): any {
  throw new Error("Function not implemented.");
}

