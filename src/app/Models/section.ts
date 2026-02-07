import { Staff } from "./staff";

export interface Section {
    sectionId: number;
    sectionName: string;
    className: string;
    sectionCode: string;
    staffId?: number;
    classTeacher?: Staff;
    roomNo: string;
    capacity: number;
}
