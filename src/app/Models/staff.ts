import { ImageUpload } from "./StaticImageModel/imageUpload";
import { Department } from "./department";
import { StaffExperience } from "./staff-experience";
import { StaffSalary } from "./staff-salary";
import { Shift } from "./shift";

export class Staff {
  staffId!: number;
  staffName!: string;
  uniqueStaffAttendanceNumber!: number;
  gender?: Gender = Gender.Male;
  dob: string | null = null;
  fatherName?: string;
  motherName?: string;
  temporaryAddress?: string;
  permanentAddress?: string;
  cnic?: string;
  imagePath: string = '';
  imageUpload: ImageUpload = new ImageUpload();
  contactNumber1?: string;
  email?: string;
  qualifications?: string;
  joiningDate?: Date;
  designation?: Designation;
  bankAccountName?: string;
  bankAccountNumber?: number;
  bankName?: string;
  bankBranch?: string;
  status?: string;
  departmentId?: number;
  department?: Department;
  basicSalary?: number;
  staffSalaryId?: number;
  staffSalary?: StaffSalary;
  shiftId?: number | null;
  shift?: Shift;
  staffExperiences: StaffExperience[] = [];
}

export enum Gender {
  Male,
  Female,
  Other
}

export enum Designation {
  Teacher,
  Admin,
  Principal,
  Accountant
}
