import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OpCcDatepickerComponent } from './op-cc-datepicker.component';
import { OpCcDatepickerModule } from './op-cc-datepicker.module';

describe('OpCcDatepickerComponent', () => {
  let component: OpCcDatepickerComponent;
  let fixture: ComponentFixture<OpCcDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpCcDatepickerModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(OpCcDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the calendar', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('p-calendar')).toBeTruthy();
  });

  it('should round-trip a Date through the FormControl', () => {
    const date = new Date(2026, 5, 23);
    component.writeValue(date);
    expect(component.control.value).toEqual(date);
    expect(component.value).toEqual(date);
  });

  it('should emit onChange on select', () => {
    const spy = jasmine.createSpy('onChange');
    component.changeEvent.subscribe(spy);
    const date = new Date(2026, 0, 1);
    component.control.setValue(date);
    component.onSelect(date);
    expect(spy).toHaveBeenCalled();
  });

  it('should honor disabled by disabling the FormControl', () => {
    component.disabled = true;
    expect(component.control.disabled).toBeTrue();
    component.disabled = false;
    expect(component.control.disabled).toBeFalse();
  });

  it('should honor isMandatory by applying a required validator', () => {
    component.isMandatory = true;
    component.ngOnInit();
    component.control.setValue(null);
    expect(component.control.valid).toBeFalse();
  });
});
