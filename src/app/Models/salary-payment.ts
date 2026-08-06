export class SalaryEntry {
  description: string = '';
  amount: number | null = null;
}

export class SalaryPayment {
  staffSalaryId?: number;
  staffId?: number;
  staffName?: string;
  paymentDate?: string | Date;
  paymentMonth?: string;
  basicSalary?: number;
  totalAdditions?: number;
  totalDeductions?: number;
  netSalary?: number;
  additions: SalaryEntry[] = [];
  deductions: SalaryEntry[] = [];
}
