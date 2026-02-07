import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaveManageComponent } from './leave-manage.component';
import { LeaveService } from '../../../services/leave.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('LeaveManageComponent', () => {
  let component: LeaveManageComponent;
  let fixture: ComponentFixture<LeaveManageComponent>;
  let leaveService: jasmine.SpyObj<LeaveService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('LeaveService', ['getLeaves', 'updateLeaveStatus']);
    spy.getLeaves.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [LeaveManageComponent, HttpClientTestingModule],
      providers: [
        { provide: LeaveService, useValue: spy }
      ]
    })
      .compileComponents();

    leaveService = TestBed.inject(LeaveService) as jasmine.SpyObj<LeaveService>;
    fixture = TestBed.createComponent(LeaveManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load leaves on init', () => {
    expect(leaveService.getLeaves).toHaveBeenCalled();
  });
});
