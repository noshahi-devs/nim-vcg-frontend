// The backend serializes this enum as its name (via JsonStringEnumConverter), not a number —
// so these must be string-valued to match what actually comes over the wire.
export enum DeductionDayBasis {
  FixedThirty = 'FixedThirty',
  ActualDaysInMonth = 'ActualDaysInMonth'
}

export class PayrollDeductionRule {
  payrollDeductionRuleId?: number;
  isActive: boolean = false;
  leavesAllowed: number = 0;
  isAbsentEqualToLeave: boolean = false;
  deductionDayBasis: DeductionDayBasis = DeductionDayBasis.FixedThirty;
  updatedAt?: string | Date;
}

export interface DeductionSuggestion {
  ruleActive: boolean;
  leavesAllowed: number;
  isAbsentEqualToLeave: boolean;
  deductionDayBasis: DeductionDayBasis;
  basisDays: number;
  basicSalary: number;
  perDayRate: number;
  workingDays: number;
  presentDays: number;
  approvedLeaveDays: number;
  absentDays: number;
  deductionDays: number;
  suggestedDeductionAmount: number;
}
