import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyPaymentComponent } from './monthly-payment.component';

describe('MonthlyPaymentComponent', () => {
  let component: MonthlyPaymentComponent;
  let fixture: ComponentFixture<MonthlyPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
