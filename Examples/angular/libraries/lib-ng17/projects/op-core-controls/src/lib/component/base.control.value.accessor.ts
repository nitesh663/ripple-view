import { Directive, Input } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl } from '@angular/forms';
import isEqual from 'lodash/isEqual';

/**
 * Base ControlValueAccessor shared by every @op control.
 *
 * Holds the backing `UntypedFormControl`, bridges the Angular forms API
 * (`writeValue`/`registerOnChange`/`registerOnTouched`) and guards redundant
 * writes with a deep `isEqual` comparison so we don't re-emit identical values.
 */
@Directive()
export abstract class BaseControlValueAccessor<T> implements ControlValueAccessor {
  /** The form control the concrete control binds its PrimeNG primitive to. */
  @Input() control: UntypedFormControl = new UntypedFormControl();

  /** When false, model writes suppress the model→view emit. */
  protected _viewChange = true;

  private _value!: T;

  /** Registered callbacks (wired by Angular forms). */
  onChange: (value: T) => void = () => {};
  onTouched: () => void = () => {};

  @Input()
  set value(v: T) {
    if (!isEqual(this._value, v)) {
      this._value = v;
      this.control.setValue(v, { emitModelToViewChange: this._viewChange });
      this.onChange(v);
    }
  }
  get value(): T {
    return this._value;
  }

  /** Toggle whether subsequent value writes emit model→view changes. */
  protected set viewChange(flag: boolean) {
    this._viewChange = flag;
  }
  protected get viewChange(): boolean {
    return this._viewChange;
  }

  // --- ControlValueAccessor -------------------------------------------------

  writeValue(value: T): void {
    if (!isEqual(this._value, value)) {
      this._value = value;
      this.control.setValue(value, { emitModelToViewChange: this._viewChange });
    }
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }
}
