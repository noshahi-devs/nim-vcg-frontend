import { AcademicMonth } from "./academicmonth";
import { DueBalance } from "./due-balance";
import { Fee } from "./fee";
import { PaymentDetail } from "./payemnt-details";
import { PaymentMonth } from "./paymentmonth";
import { Student } from "./student";

export class MonthlyPayment {
  monthlyPaymentId!: number;
  studentId!: number;
  totalFeeAmount!: number;
  waver!: number;
  previousDue!: number;
  totalAmount!: number;
  amountPaid!: number;
  amountRemaining!: number;
  paymentDate: Date = new Date();
  student!: Student;
  paymentMethod?: string;
  transactionId?: string;
  sendSms?: boolean;
  printReceipt?: boolean;

  fees: Fee[] = [];
  academicMonths: AcademicMonth[] = [];

  paymentMonths: any[] = [];
  paymentDetails: any[] = [];
  dueBalances: any[] = [];
}
