export interface Campus {
    campusId: number;
    campusName: string;
    campusCode: string;
    address?: string;
    contactNumber?: string;
    email?: string;
    isActive: boolean;
    createdAt?: Date;
}
