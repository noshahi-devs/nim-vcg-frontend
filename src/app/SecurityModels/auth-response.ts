export interface AuthResponse {
  username: string;
  email: string;
  token: string;
  roles: string[];
  permissions: string[];
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
