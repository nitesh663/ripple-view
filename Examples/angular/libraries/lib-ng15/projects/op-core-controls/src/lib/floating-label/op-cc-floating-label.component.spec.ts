import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

import { OpCcFloatingLabelComponent } from './op-cc-floating-label.component';

describe('OpCcFloatingLabelComponent', () => {
  let component: OpCcFloatingLabelComponent;
  let fixture: ComponentFixture<OpCcFloatingLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OpCcFloatingLabelComponent],
      imports: [TranslateModule.forRoot(), TooltipModule],
    }).compileComponents();

    fixture = TestBed.createComponent(OpCcFloatingLabelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the label text', () => {
    component.label = 'First Name';
    fixture.detectChanges();
    const label: HTMLElement = fixture.nativeElement.querySelector('.op-cc-label');
    expect(label.textContent).toContain('First Name');
  });

  it('should show the mandatory marker when isMandatory is true', () => {
    component.label = 'Email';
    component.isMandatory = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.op-cc-mandatory')).toBeTruthy();
  });

  it('should not show the mandatory marker by default', () => {
    component.label = 'Email';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.op-cc-mandatory')).toBeFalsy();
  });
});
