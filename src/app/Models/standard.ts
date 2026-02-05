import { Student } from "./student";
import { Subject } from "./subject";

export class Standard {
  standardId: number = 0;
  standardName: string = '';
  standardCode?: string;
  gradeLevel?: string;
  roomNo?: string;
  standardCapacity?: string;
  remarks?: string;
  status?: string;
  students?: Student[] = [];
  subjects?: Subject[] = [];
  classTeacher?: string;
  classCode?: string;
  className?: string;
  section?: string;
}
