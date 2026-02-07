export enum LeaveType {
    Sick = 0,
    Casual = 1,
    Vacation = 2,
    Maternity = 3,
    Paternity = 4,
    Emergency = 5,
    Other = 6
}

export enum LeaveStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Cancelled = 3
}

export interface Leave {
    leaveId?: number;
    staffId: number;
    staff?: any;
    leaveType: LeaveType;
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
    status: LeaveStatus;
    appliedDate?: string | Date;
    approvedByStaffId?: number;
    approvedBy?: any;
    adminRemarks?: string;
}

export interface LeaveStatusUpdate {
    status: LeaveStatus;
    adminId: number;
    remarks?: string;
}
