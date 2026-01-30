import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseManageComponent } from './expense-manage.component';

describe('ExpenseManageComponent', () => {
  let component: ExpenseManageComponent;
  let fixture: ComponentFixture<ExpenseManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
