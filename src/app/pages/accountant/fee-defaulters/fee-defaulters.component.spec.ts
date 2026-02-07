import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeDefaultersComponent } from './fee-defaulters.component';

describe('FeeDefaultersComponent', () => {
  let component: FeeDefaultersComponent;
  let fixture: ComponentFixture<FeeDefaultersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeeDefaultersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeeDefaultersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
