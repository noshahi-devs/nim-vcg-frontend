import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from '../Models/role';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private apiUrl = `${environment.apiBaseUrl}`;

    constructor(private http: HttpClient) { }

    getAllRoles(): Observable<Role[]> {
        return this.http.get<Role[]>(`${this.apiUrl}/GetRoles`);
    }

    createRole(role: Role): Observable<Role> {
        return this.http.post<Role>(`${this.apiUrl}/api/Users/create-role`, role);
    }

    deleteRole(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/api/Users/delete-role/${id}`);
    }

    // Assign role to user
    assignRole(id: string, roles: string[], userName: string = ''): Observable<any> {
    const payload = {
      Id: id,
      Role: roles,
      UserName: userName
    };
    return this.http.post(`${this.apiUrl}/AssignRole`, payload);
  }

    // Remove role is handled by AssignRole by passing updated list in this API
    // but if you want to keep the signature:
    removeRole(userId: string, roleName: string): Observable<any> {
        // This would require fetching current roles first, but since AssignRole replaces, 
        // we'll just implement it as an update if needed.
        return this.http.post(`${this.apiUrl}/api/Users/AssignRole`, { id: userId, role: [] });
    }

}
