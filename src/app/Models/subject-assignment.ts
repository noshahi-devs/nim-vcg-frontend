import { Staff } from "./staff";
import { Subject } from "./subject";
import { Section } from "./section";

export interface SubjectAssignment {
    subjectAssignmentId: number;
    staffId: number;
    staff?: Staff;
    subjectId: number;
    subject?: Subject;
    sectionId: number;
    section?: Section;
}
