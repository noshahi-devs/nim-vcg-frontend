import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionAddComponent } from './section-add.component';

describe('SectionAddComponent', () => {
  let component: SectionAddComponent;
  let fixture: ComponentFixture<SectionAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
