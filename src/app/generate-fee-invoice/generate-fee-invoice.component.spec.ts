import { ComponentFixture, TestBed } from '@angular/core/testing';

import {GenerateFeeInvoiceComponent } from './generate-fee-invoice.component';

describe('CollectFeeComponent', () => {
  let component: GenerateFeeInvoiceComponent;
  let fixture: ComponentFixture<GenerateFeeInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateFeeInvoiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateFeeInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
