import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountsLedgerComponent } from './accounts-ledger.component';

describe('AccountsLedgerComponent', () => {
  let component: AccountsLedgerComponent;
  let fixture: ComponentFixture<AccountsLedgerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsLedgerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountsLedgerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
