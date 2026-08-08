import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { PayrollDeductionRuleService } from '../../../services/payroll-deduction-rule.service';
import { DeductionDayBasis, PayrollDeductionRule } from '../../../Models/payroll-deduction-rule';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-payroll-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './payroll-rules.component.html',
  styleUrl: './payroll-rules.component.css'
})
export class PayrollRulesComponent implements OnInit {
  title = 'Payroll Deduction Rule';

  rule: PayrollDeductionRule = new PayrollDeductionRule();
  loading = false;
  isSaving = false;
  DeductionDayBasis = DeductionDayBasis;

  // Illustrative only — the real rate always comes from each staff member's own Basic Salary.
  exampleBasicSalary = 30000;

  constructor(
    private ruleService: PayrollDeductionRuleService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadRule();
  }

  loadRule(): void {
    this.loading = true;
    this.ruleService.getRule().pipe(finalize(() => this.loading = false)).subscribe({
      next: (rule) => this.rule = rule,
      error: () => this.popup.error('Load Error', 'Unable to load the payroll deduction rule.')
    });
  }

  save(): void {
    this.isSaving = true;
    this.popup.loading('Saving rule...');

    this.ruleService.updateRule(this.rule).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (rule) => {
        this.rule = rule;
        this.popup.success('Saved!', 'Payroll deduction rule updated successfully.');
      },
      error: () => this.popup.error('Error', 'Failed to save the payroll deduction rule.')
    });
  }

  // Live worked example shown on the page so admins can sanity-check the rule as they edit it.
  get exampleBasisDays(): number {
    if (this.rule.deductionDayBasis === DeductionDayBasis.ActualDaysInMonth) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }
    return 30;
  }

  get examplePerDayRate(): number {
    return this.exampleBasicSalary / this.exampleBasisDays;
  }

  get exampleDeductionDaysIfNotEqual(): number {
    const absences = 3;
    return absences; // absences never draw from the allowance
  }

  get exampleDeductionDaysIfEqual(): number {
    const absences = 3;
    return Math.max(0, absences - (this.rule.leavesAllowed || 0));
  }
}
