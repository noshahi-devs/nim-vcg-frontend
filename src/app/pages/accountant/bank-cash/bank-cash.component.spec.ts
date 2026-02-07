import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BankAccountService } from '../../../services/bank-account.service';
import { PaymentGatewayService } from '../../../services/payment-gateway.service';
import { BankCashComponent } from './bank-cash.component';

describe('BankCashComponent', () => {
  let component: BankCashComponent;
  let fixture: ComponentFixture<BankCashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankCashComponent, HttpClientTestingModule],
      providers: [BankAccountService, PaymentGatewayService]
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
