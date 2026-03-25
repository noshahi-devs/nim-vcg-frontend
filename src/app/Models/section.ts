import { Staff } from "./staff";

export interface Section {
    sectionId: number;
    sectionName: string;
    className: string;
    sectionCode: string;
    staffId?: number;
    classTeacher?: Staff;
    classTeacherName?: string;
    roomNo?: string;
    capacity?: number;
}
