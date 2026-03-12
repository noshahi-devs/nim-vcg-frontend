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

      // 2. Determine which one is active
      const savedYearId = forceSystemUpdate ? null : localStorage.getItem('SELECTED_ACADEMIC_YEAR_ID');
      if (savedYearId) {
        const found = years.find(y => y.academicYearId === Number(savedYearId));
        if (found) {
          this.currentYearSubject.next(found);
          return;
        }
      }

      // 3. Fallback to global "Active Year" from settings
      this.settingsService.getGeneralSettings().subscribe(settings => {
        const activeYearName = settings.find(s => s.settingKey === 'academicYear')?.settingValue;
        if (activeYearName) {
          const found = years.find(y => y.name === activeYearName);
          if (found) {
            this.setContextYear(found);
          } else if (years.length > 0) {
            // Last fallback: first year in list
            this.setContextYear(years[0]);
          }
        } else if (years.length > 0) {
          this.setContextYear(years[0]);
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
