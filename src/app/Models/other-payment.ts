import { OtherPaymentDetail } from "./other-payment-details";
import { Student } from "./student";

export class OthersPayment {
  othersPaymentId!: number;
  studentId!: number;
  totalAmount!: number;
  totalFeeAmount!: number;
  previousDue!: number;
  amountPaid!: number;
  amountRemaining!: number;
  paymentDate!: Date;
  student!: Student;
  fees: { feeId: number }[] = [];
  otherPaymentDetails: OtherPaymentDetail[] = [];
  academicMonths: any[];
  waver!: number;
}
