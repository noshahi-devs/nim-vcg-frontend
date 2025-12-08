import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatEmptyComponent } from './chat-empty.component';

describe('ChatEmptyComponent', () => {
  let component: ChatEmptyComponent;
  let fixture: ComponentFixture<ChatEmptyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatEmptyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatEmptyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
