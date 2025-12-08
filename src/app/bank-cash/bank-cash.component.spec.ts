import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankCashComponent } from './bank-cash.component';

describe('BankCashComponent', () => {
  let component: BankCashComponent;
  let fixture: ComponentFixture<BankCashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankCashComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankCashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
