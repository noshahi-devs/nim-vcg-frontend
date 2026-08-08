export class Shift {
  shiftId: number = 0;
  shiftName: string = '';
  startTime: string = '';
  endTime: string = '';
  graceMinutes: number = 0;
  isActive: boolean = true;
  staffCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
