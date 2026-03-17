import { ExamScheduleStandard } from "./exam-schedule-standard";

export class ExamSchedule {
  examScheduleId!: number;
  examScheduleName!: string;
  startDate?: string;
  endDate?: string;
  examYear?: string;
  examScheduleStandards: ExamScheduleStandard[] = [];
}
