
export interface Role {
    id: string; // or number, keeping string for Identity roles usually
    name: string;
    description?: string;
    permissions?: string[];
}

export interface UserRoleAssignment {
    userId: string;
    roleId: string;
}