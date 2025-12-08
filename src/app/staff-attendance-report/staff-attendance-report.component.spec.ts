import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffAttendanceReportComponent } from './staff-attendance-report.component';

describe('StaffAttendanceReportComponent', () => {
  let component: StaffAttendanceReportComponent;
  let fixture: ComponentFixture<StaffAttendanceReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffAttendanceReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffAttendanceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
