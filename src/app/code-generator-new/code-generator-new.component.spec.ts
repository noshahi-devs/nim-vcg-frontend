import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeGeneratorNewComponent } from './code-generator-new.component';

describe('CodeGeneratorNewComponent', () => {
  let component: CodeGeneratorNewComponent;
  let fixture: ComponentFixture<CodeGeneratorNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeGeneratorNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeGeneratorNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
