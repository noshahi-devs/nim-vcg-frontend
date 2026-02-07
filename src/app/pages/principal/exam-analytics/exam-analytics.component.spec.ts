import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamAnalyticsComponent } from './exam-analytics.component';

describe('ExamAnalyticsComponent', () => {
  let component: ExamAnalyticsComponent;
  let fixture: ComponentFixture<ExamAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
