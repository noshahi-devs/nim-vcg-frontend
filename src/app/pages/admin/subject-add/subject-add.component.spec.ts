import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectAddComponent } from './subject-add.component';

describe('SubjectAddComponent', () => {
  let component: SubjectAddComponent;
  let fixture: ComponentFixture<SubjectAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
