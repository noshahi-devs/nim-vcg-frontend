export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  token: string;
  roles: string[];
  permissions: string[];
  studentId?: number;
}

export class AppUser {

  public userName!: string;
  public id!: string;
  public role: string[] = [];
}

export class AppRole {

  public id!: string;
  public name!: string;
}


//export class AppUserRole {
//  public userId!: string;
//  public roles: string[] = [];
//}
