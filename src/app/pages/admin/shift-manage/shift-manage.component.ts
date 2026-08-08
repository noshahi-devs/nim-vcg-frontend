import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ShiftService } from '../../../services/shift.service';
import { PopupService } from '../../../services/popup.service';
import { Shift } from '../../../Models/shift';

@Component({
  selector: 'app-shift-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './shift-manage.component.html',
  styleUrl: './shift-manage.component.css'
})
export class ShiftManageComponent implements OnInit {

  title = 'Manage Shifts';

  /** FORM MODEL */
  shift: Shift = new Shift();
  isEditing = false;

  /** TABLE DATA */
  shifts: Shift[] = [];

  /** UI STATES */
  searchQuery = '';
  itemsPerPage = 10;
  currentPage = 1;
  loading = false;
  isProcessing = false;
  Math = Math; // For template access

  constructor(
    private shiftService: ShiftService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadShifts();
  }

  /* ================= GETTERS FOR STATS ================= */
  get totalShifts(): number {
    return this.shifts.length;
  }

  get activeShifts(): number {
    return this.shifts.filter(s => s.isActive).length;
  }

  get totalStaffAssigned(): number {
    return this.shifts.reduce((acc, s) => acc + (s.staffCount || 0), 0);
  }

  /* ================= LOAD DATA ================= */
  loadShifts(): void {
    this.loading = true;
    this.shiftService.getAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => this.shifts = res || [],
      error: () => this.popup.error('Load Error', 'Unable to load shifts.')
    });
  }

  /* ================= TIME HELPERS ================= */
  /** Convert an "HH:mm:ss" / "HH:mm" API time string into "HH:mm" for <input type="time">. */
  toInputTime(time: string | null | undefined): string {
    if (!time) return '';
    const parts = time.split(':');
    return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
  }

  /** Convert an "HH:mm" input value into "HH:mm:ss" for the API. */
  toApiTime(time: string | null | undefined): string | null {
    if (!time) return null;
    const parts = time.split(':');
    return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}:00`;
  }

  /** Format an "HH:mm:ss" / "HH:mm" time string into "08:00 AM" style. */
  formatTime12(time: string | null | undefined): string {
    if (!time) return '';
    const parts = time.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = (parts[1] || '00').padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hoursStr = hours < 10 ? '0' + hours : '' + hours;
    return `${hoursStr}:${minutes} ${ampm}`;
  }

  formatTimeRange(s: Shift): string {
    const start = this.formatTime12(s.startTime);
    const end = s.endTime ? this.formatTime12(s.endTime) : '';
    return end ? `${start} \u2013 ${end}` : start;
  }

  /* ================= SAVE SHIFT ================= */
  saveShift(): void {
    if (!this.shift.shiftName || !this.shift.startTime) {
      this.popup.warning('Please fill in Shift Name and Start Time.', 'Form Incomplete');
      return;
    }

    const payload = {
      shiftId: this.isEditing ? this.shift.shiftId : 0,
      shiftName: this.shift.shiftName,
      startTime: this.toApiTime(this.shift.startTime),
      endTime: this.shift.endTime ? this.toApiTime(this.shift.endTime) : null,
      graceMinutes: this.shift.graceMinutes || 0,
      isActive: this.shift.isActive
    };

    this.isProcessing = true;
    this.popup.loading(this.isEditing ? 'Updating shift...' : 'Saving shift...');

    const req$ = this.isEditing
      ? this.shiftService.update(this.shift.shiftId, payload)
      : this.shiftService.create(payload);

    req$.pipe(finalize(() => this.isProcessing = false)).subscribe({
      next: () => {
        if (this.isEditing) {
          this.popup.updated('Shift');
        } else {
          this.popup.saved('Shift');
        }
        this.resetForm();
        this.loadShifts();
      },
      error: (err) => {
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || 'An error occurred while saving the shift.');
        this.popup.error('Save Failed', msg);
      }
    });
  }

  /* ================= EDIT ================= */
  editShift(s: Shift): void {
    this.isEditing = true;
    this.shift = {
      ...s,
      startTime: this.toInputTime(s.startTime),
      endTime: s.endTime ? this.toInputTime(s.endTime) : ''
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ================= DELETE ================= */
  deleteShift(id: number): void {
    this.popup.confirm('Delete Shift?', 'This action cannot be undone. Staff still assigned to this shift may prevent deletion.').then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting shift...');
        this.shiftService.delete(id).subscribe({
          next: () => {
            this.popup.deleted('Shift');
            this.loadShifts();
          },
          error: (err) => {
            const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || undefined);
            this.popup.deleteError('shift', msg);
          }
        });
      }
    });
  }

  /* ================= RESET ================= */
  resetForm(): void {
    this.shift = new Shift();
    this.isEditing = false;
  }

  /* ================= FILTER + PAGINATION ================= */
  get filteredShifts(): Shift[] {
    if (!this.searchQuery) return this.shifts;
    return this.shifts.filter(s =>
      s.shiftName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get paginatedShifts(): Shift[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredShifts.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredShifts.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
