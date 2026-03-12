export class StaffSalary {
  // Per individual Staff's salary prototype
  staffSalaryId!: number;
  staffName?: string; // this proprty is for just Drop-down list; same as staffName of Staff class
  staffId?: number | string; // UI property for proper dropdown validation
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
