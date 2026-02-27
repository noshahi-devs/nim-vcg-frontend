// import { inject } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
// import { AuthService } from './auth.service';

// export const AuthGuard: CanActivateFn = (route, state) => {
//   let authenticationService = inject(AuthService);
//   let router = inject(Router);
//   //alert(JSON.stringify(authenticationService.userValue));
//   const user = authenticationService.userValue;

//   if (user) {
//     // check if route is restricted by role


//     const { roles } = route.data;

//     let roleList: string[] = roles;//['Admin', 'Operator']

//     //alert('route role: ' + role);
//     if (roleList) {


//       //alert('user role: ' + user.roles.join(','));

//       //alert(user.roles.includes(role));// ["Manager","HR", ]
//       const filteredArray = roleList.filter(value => user.roles.includes(value));// []
//       if (roles && roleList.length > 0 && filteredArray.length == 0)
//       // if (roles && roleList.length > 0 && !user.roles.includes(roles))
//       {
//         alert('not authorized');
//         // role not authorized so redirect to home page
//         router.navigate(['/']);
//         return false;
//       }

//       // authorized so return true
//       return true;
//     }
//     return true;
//   }
//   // not logged in so redirect to login page with the return url
//   router.navigate(['/sign-in'], { queryParams: { returnUrl: state.url } });
//   return false;


//   //if (!authService.isLoggedIn()) {
//   //  localStorage.setItem("redirectTo", window.location.href);
//   //  router.navigate(['/login']);
//   //  return false;
//   //}
//   //return true;
// };

// // //export class AuthGuard2 implements CanActivate {
// // //  constructor(
// // //    private router: Router,
// // //    private authenticationService: AuthService
// // //  ) { }

// // //  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
// // //    const user = this.authenticationService.userValue;
// // //    if (user) {
// // //      // check if route is restricted by role
// // //      const { roles } = route.data;
// // //      if (roles && !roles.includes(user.roles)) {
// // //        // role not authorized so redirect to home page
// // //        this.router.navigate(['/']);
// // //        return false;
// // //      }

// // //      // authorized so return true
// // //      return true;
// // //    }

// // //    // not logged in so redirect to login page with the return url
// // //    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
// // //    return false;
// // //  }
// // //}




















// // import { inject } from "@angular/core";
// // import { CanActivateFn, Router } from "@angular/router";
// // import { AuthService } from "./auth.service";

// // export const AuthGuard: CanActivateFn = (route, state) => {
// //  let authService = inject(AuthService);
// //  let routerService = inject(Router);
// //  if (!authService.isLoggedIn) {
// //    localStorage.setItem("redirectTo", route.url[0].path);
// //    routerService.navigate(['/sign-in']);
// //    return false;
// //  }
// //  return true;
// // };


import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 🔐 1. Check login
  if (!authService.isLoggedIn) {
    router.navigate(['/sign-in'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Get current user
  const user = authService.userValue;
  if (!user || !user.roles || user.roles.length === 0) {
    // No roles assigned
    router.navigate(['/unauthorized']); // Or dashboard
    return false;
  }

  // 🔐 2. Check route-specific roles & permissions
  const allowedRoles: string[] = route.data['roles'] ?? [];
  const requiredPermissions: string[] = route.data['permissions'] ?? [];

  // Check Roles
  if (allowedRoles.length > 0) {
    const hasRoleAccess = user.roles.some(r => allowedRoles.includes(r));
    if (!hasRoleAccess) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  // Check Permissions (Granular)
  if (requiredPermissions.length > 0) {
    const hasPermission = user.permissions.some(p => requiredPermissions.includes(p));
    if (!hasPermission) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  // ✅ Authorized
  return true;
};
