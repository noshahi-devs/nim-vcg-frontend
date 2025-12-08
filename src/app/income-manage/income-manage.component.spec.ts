import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncomeManageComponent } from './income-manage.component';

describe('IncomeManageComponent', () => {
  let component: IncomeManageComponent;
  let fixture: ComponentFixture<IncomeManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
