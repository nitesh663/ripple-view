import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OpCcDropdownComponent } from './op-cc-dropdown.component';
import { OpCcDropdownModule } from './op-cc-dropdown.module';

describe('OpCcDropdownComponent', () => {
  let component: OpCcDropdownComponent;
  let fixture: ComponentFixture<OpCcDropdownComponent>;

  const options = [
    { label: 'One', value: 1 },
    { label: 'Two', value: 2 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpCcDropdownModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(OpCcDropdownComponent);
    component = fixture.componentInstance;
    component.options = options;
    fixture.detectChanges();
  });

  it('should render', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('p-dropdown')).toBeTruthy();
  });

  it('should round-trip a value through the FormControl', () => {
    component.writeValue(2);
    expect(component.control.value).toBe(2);
    expect(component.value).toBe(2);
  });

  it('should emit onChange when the value changes', () => {
    const spy = jasmine.createSpy('onChange');
    component.changeEvent.subscribe(spy);
    component.control.setValue(1);
    component.doChange({ value: 1 });
    expect(spy).toHaveBeenCalled();
    expect(component.value).toBe(1);
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

  it('should sort options alphabetically when enabled', () => {
    component.sortAlphabetically = true;
    component.options = [
      { label: 'Zebra', value: 1 },
      { label: 'Apple', value: 2 },
    ];
    expect(component.options[0].label).toBe('Apple');
  });
});
