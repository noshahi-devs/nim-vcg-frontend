import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffManageLoginComponent } from './staff-manage-login.component';

describe('StaffManageLoginComponent', () => {
  let component: StaffManageLoginComponent;
  let fixture: ComponentFixture<StaffManageLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffManageLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffManageLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
