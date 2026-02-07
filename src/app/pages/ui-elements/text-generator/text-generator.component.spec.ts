import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextGeneratorComponent } from './text-generator.component';

describe('TextGeneratorComponent', () => {
  let component: TextGeneratorComponent;
  let fixture: ComponentFixture<TextGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
