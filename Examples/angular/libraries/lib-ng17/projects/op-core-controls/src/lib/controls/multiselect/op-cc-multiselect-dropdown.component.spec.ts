import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OpCcMultiselectDropdownComponent } from './op-cc-multiselect-dropdown.component';
import { OpCcMultiselectDropdownModule } from './op-cc-multiselect-dropdown.module';

describe('OpCcMultiselectDropdownComponent', () => {
  let component: OpCcMultiselectDropdownComponent;
  let fixture: ComponentFixture<OpCcMultiselectDropdownComponent>;

  const options = [
    { label: 'Red', value: 'r' },
    { label: 'Green', value: 'g' },
    { label: 'Blue', value: 'b' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpCcMultiselectDropdownModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(OpCcMultiselectDropdownComponent);
    component = fixture.componentInstance;
    component.options = options;
    fixture.detectChanges();
  });

  it('should render the multiselect', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('p-multiselect')).toBeTruthy();
  });

  it('should round-trip an array value through the FormControl', () => {
    component.writeValue(['r', 'b']);
    expect(component.control.value).toEqual(['r', 'b']);
    expect(component.value).toEqual(['r', 'b']);
  });

  it('should emit onChange when selection changes', () => {
    const spy = jasmine.createSpy('onChange');
    component.changeEvent.subscribe(spy);
    component.control.setValue(['g']);
    component.onSelectionChange({ value: ['g'] });
    expect(spy).toHaveBeenCalled();
    expect(component.value).toEqual(['g']);
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
