import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceGeneratorComponent } from './voice-generator.component';

describe('VoiceGeneratorComponent', () => {
  let component: VoiceGeneratorComponent;
  let fixture: ComponentFixture<VoiceGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
