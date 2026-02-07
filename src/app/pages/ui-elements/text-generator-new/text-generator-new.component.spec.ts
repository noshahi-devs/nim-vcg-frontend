import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextGeneratorNewComponent } from './text-generator-new.component';

describe('TextGeneratorNewComponent', () => {
  let component: TextGeneratorNewComponent;
  let fixture: ComponentFixture<TextGeneratorNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextGeneratorNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextGeneratorNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
