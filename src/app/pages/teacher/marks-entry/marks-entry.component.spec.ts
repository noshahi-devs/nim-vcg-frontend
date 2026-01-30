import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarksEntryComponent } from './marks-entry.component';

describe('MarksEntryComponent', () => {
  let component: MarksEntryComponent;
  let fixture: ComponentFixture<MarksEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarksEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarksEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
