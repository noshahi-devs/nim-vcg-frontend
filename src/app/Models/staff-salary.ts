export class StaffSalary {
  // Per individual Staff's salary prototype
  staffSalaryId!: number;
  staffName?: string;
  staffId?: number | string;
  paymentDate?: string | Date; // Match backend
  paymentMonth?: string;       // Jan, Feb, etc.
  basicSalary?: number;
  festivalBonus?: number;
  allowance?: number;
  medicalAllowance?: number;
  housingAllowance?: number;
  transportationAllowance?: number;
  savingFund: number = 0;
  taxes: number = 0;
  netSalary?: number; 

  //constructor() {
  //  this.savingFund = 0;
  //  this.taxes = 0;
  //}

  
}
