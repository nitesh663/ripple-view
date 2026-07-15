import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OpCcInputComponent } from './op-cc-input.component';
import { OpCcInputModule } from './op-cc-input.module';

describe('OpCcInputComponent', () => {
  let component: OpCcInputComponent;
  let fixture: ComponentFixture<OpCcInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpCcInputModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(OpCcInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render an input element', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });

  it('should round-trip a value through the FormControl', () => {
    component.writeValue('hello');
    expect(component.control.value).toBe('hello');
    expect(component.value).toBe('hello');
  });

  it('should emit onChange on input', () => {
    const spy = jasmine.createSpy('onChange');
    component.changeEvent.subscribe(spy);
    component.control.setValue('typed');
    component.onInput({ target: { value: 'typed' } });
    expect(spy).toHaveBeenCalled();
    expect(component.value).toBe('typed');
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
    component.control.setValue('');
    expect(component.control.valid).toBeFalse();
  });
});
