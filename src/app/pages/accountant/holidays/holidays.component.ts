import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { HolidayService } from '../../../services/holiday.service';
import { Holiday } from '../../../Models/holiday';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './holidays.component.html',
  styleUrl: './holidays.component.css'
})
export class HolidaysComponent implements OnInit {
  title = 'Holidays';

  newHoliday: Holiday = new Holiday();
  holidays: Holiday[] = [];
  loading = false;
  isSaving = false;

  constructor(
    private holidayService: HolidayService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.loading = true;
    this.holidayService.getAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: (holidays) => this.holidays = holidays,
      error: () => this.popup.error('Load Error', 'Unable to load holidays.')
    });
  }

  save(): void {
    if (!this.newHoliday.date || !this.newHoliday.name) {
      this.popup.warning('Incomplete', 'Please provide both a date and a name for the holiday.');
      return;
    }

    this.isSaving = true;
    this.holidayService.create(this.newHoliday).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.popup.success('Saved!', 'Holiday added successfully.');
        this.newHoliday = new Holiday();
        this.loadHolidays();
      },
      error: (err) => {
        const message = err?.error || 'Failed to add holiday.';
        this.popup.error('Error', typeof message === 'string' ? message : 'Failed to add holiday.');
      }
    });
  }

  remove(id: number | undefined): void {
    if (!id) return;
    this.popup.confirm('Delete Holiday?', 'This action cannot be undone.').then(confirmed => {
      if (confirmed) {
        this.holidayService.delete(id).subscribe({
          next: () => {
            this.popup.deleted('Holiday');
            this.loadHolidays();
          },
          error: () => this.popup.error('Error', 'Could not delete the holiday.')
        });
      }
    });
  }
}
