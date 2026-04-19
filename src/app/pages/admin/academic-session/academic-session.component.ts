import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicYearService } from '../../../services/academic-year.service';
import { AcademicYear } from '../../../Models/academic-year';
import { PopupService } from '../../../services/popup.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-academic-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './academic-session.component.html',
  styleUrl: './academic-session.component.css'
})
export class AcademicSessionComponent implements OnInit {
  sessions: AcademicYear[] = [];
  isLoading = true;
  isSaving = false;

  // Add form
  newSessionName = '';
  showAddForm = false;

  // Edit state
  editingId: number | null = null;
  editingName = '';

  constructor(
    private academicYearService: AcademicYearService,
    private popup: PopupService
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading = true;
    this.academicYearService.getAcademicYears().subscribe({
      next: (data) => {
        this.sessions = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.popup.error('Load Error', 'Failed to load academic sessions.');
      }
    });
  }

  addSession(): void {
    const name = this.newSessionName.trim();
    if (!name) {
      this.popup.warning('Validation Required', 'Please enter a session name (e.g. 2024-25).');
      return;
    }
    
    this.popup.loading('Creating session...');
    this.isSaving = true;
    const payload: AcademicYear = { academicYearId: 0, name };
    
    this.academicYearService.createAcademicYear(payload)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.popup.closeLoading();
      }))
      .subscribe({
        next: () => {
          this.newSessionName = '';
          this.showAddForm = false;
          this.popup.success('Success!', `Session <b>${name}</b> created successfully!`);
          this.loadSessions();
        },
        error: () => this.popup.error('Create Failed', 'Failed to create academic session.')
      });
  }

  startEdit(session: AcademicYear): void {
    this.editingId = session.academicYearId;
    this.editingName = session.name;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingName = '';
  }

  saveEdit(session: AcademicYear): void {
    const name = this.editingName.trim();
    if (!name) {
      this.popup.warning('Validation Required', 'Session name cannot be empty.');
      return;
    }

    this.popup.loading('Updating session...');
    this.isSaving = true;
    const updated: AcademicYear = { ...session, name };
    
    this.academicYearService.updateAcademicYear(updated)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.popup.closeLoading();
      }))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.popup.success('Success!', `Session updated to <b>${name}</b>.`);
          this.loadSessions();
        },
        error: () => this.popup.error('Update Failed', 'Failed to update academic session.')
      });
  }

  deleteSession(session: AcademicYear): void {
    this.popup.confirm(
      'Delete Session?',
      `Are you sure you want to delete <b>${session.name}</b>? This cannot be undone.`
    ).then(isConfirmed => {
      if (isConfirmed) {
        this.popup.loading('Deleting session...');
        this.academicYearService.deleteAcademicYear(session.academicYearId)
          .pipe(finalize(() => this.popup.closeLoading()))
          .subscribe({
            next: () => {
              this.popup.success('Deleted!', `Session <b>${session.name}</b> deleted.`);
              this.loadSessions();
            },
            error: () => this.popup.error('Delete Failed', 'Failed to delete academic session.')
          });
      }
    });
  }
}
