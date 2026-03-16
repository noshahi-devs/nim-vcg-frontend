import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { AcademicYear } from '../Models/academic-year';
import { AcademicYearService } from './academic-year.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private currentYearSubject = new BehaviorSubject<AcademicYear | null>(null);
  public currentYear$ = this.currentYearSubject.asObservable();

  private allYearsSubject = new BehaviorSubject<AcademicYear[]>([]);
  public allYears$ = this.allYearsSubject.asObservable();

  constructor(
    private academicYearService: AcademicYearService,
    private settingsService: SettingsService
  ) {
    this.refreshSession();
  }

  public refreshSession(forceSystemUpdate: boolean = false) {
    // 1. Load all academic years
    this.academicYearService.getAcademicYears().subscribe(years => {
      this.allYearsSubject.next(years);

      // 2. Fetch Settings and Decide
      this.settingsService.getGeneralSettings().subscribe(settings => {
        const activeYearName = settings.find(s => s.settingKey === 'academicYear')?.settingValue;
        const savedYearId = localStorage.getItem('SELECTED_ACADEMIC_YEAR_ID');
        
        let found = null;

        // NEW PRIORITY 1: Current Calendar Year (e.g. "2026")
        // The user wants 2026 to be the "understood" default.
        const currentCalendarYear = new Date().getFullYear().toString();
        found = years.find(y => y.name.includes(currentCalendarYear));

        // Priority 2: Global Active Year from Settings (if Priority 1 failed or we want to allow override)
        if (!found && activeYearName) {
          found = years.find(y => y.name === activeYearName);
        }

        // Priority 3: Saved LocalStorage (only if not forcing a system update)
        if (!found && savedYearId && !forceSystemUpdate) {
          found = years.find(y => y.academicYearId === Number(savedYearId));
        }

        // Priority 4: Highest ID (latest added)
        if (!found && years.length > 0) {
          found = [...years].sort((a, b) => b.academicYearId - a.academicYearId)[0];
        }

        if (found) {
          // If we found a valid year, set it as the context
          this.setContextYear(found);
        }
      });
    });
  }

  setContextYear(year: AcademicYear) {
    localStorage.setItem('SELECTED_ACADEMIC_YEAR_ID', year.academicYearId.toString());
    this.currentYearSubject.next(year);
  }

  getCurrentYearId(): number | null {
    return this.currentYearSubject.value?.academicYearId || null;
  }
}
