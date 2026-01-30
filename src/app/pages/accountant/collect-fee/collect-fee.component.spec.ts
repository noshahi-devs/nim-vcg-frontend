import { ComponentFixture, TestBed } from '@angular/core/testing';

import {CollectFeeComponent } from './collect-fee.component';

describe('CollectFeeComponent', () => {
  let component: CollectFeeComponent;
  let fixture: ComponentFixture<CollectFeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectFeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
