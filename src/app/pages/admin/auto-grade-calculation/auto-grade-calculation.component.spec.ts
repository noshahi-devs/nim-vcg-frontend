import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoGradeCalculationComponent } from './auto-grade-calculation.component';

describe('AutoGradeCalculationComponent', () => {
  let component: AutoGradeCalculationComponent;
  let fixture: ComponentFixture<AutoGradeCalculationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoGradeCalculationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoGradeCalculationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
