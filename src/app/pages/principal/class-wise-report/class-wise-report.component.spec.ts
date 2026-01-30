import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassWiseReportComponent } from './class-wise-report.component';

describe('ClassWiseReportComponent', () => {
  let component: ClassWiseReportComponent;
  let fixture: ComponentFixture<ClassWiseReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassWiseReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassWiseReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
