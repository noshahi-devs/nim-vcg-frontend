import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffJobLetterComponent } from './staff-job-letter.component';

describe('StaffJobLetterComponent', () => {
  let component: StaffJobLetterComponent;
  let fixture: ComponentFixture<StaffJobLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffJobLetterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffJobLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
