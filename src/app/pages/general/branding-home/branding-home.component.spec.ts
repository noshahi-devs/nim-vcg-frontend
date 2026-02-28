import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppConfigService } from '../../../services/app-config.service';
import { BrandingHomeComponent } from './branding-home.component';

describe('BrandingHomeComponent', () => {
  let component: BrandingHomeComponent;
  let fixture: ComponentFixture<BrandingHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandingHomeComponent],
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            config$: of({
              instituteName: 'NIM',
              instituteLogo: 'assets/images/logo.png'
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandingHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
