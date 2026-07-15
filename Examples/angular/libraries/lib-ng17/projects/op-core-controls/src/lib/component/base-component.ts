import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { ValidationRule } from '@op/commonservices';

import { States } from './common-enum';
import { BaseControlValueAccessor } from './base.control.value.accessor';

/** A selectable option used by dropdown/multiselect controls. */
export interface ISelectItem {
  label?: string;
  value: unknown;
  styleClass?: string;
  icon?: string;
  disabled?: boolean;
  children?: ISelectItem[];
}

/** CSS sizing/layout hints applied to a control. */
export interface ControlCssStyles {
  sizeClass?: string;
  floatingClass?: string;
  customClass?: string;
}

/**
 * Declarative description of a control, allowing a host to configure a control
 * from a single object (`[attribute]="..."`) instead of many bindings.
 */
export interface InputAttribute<T> {
  attributeName?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  options?: ISelectItem[];
  value?: T;
  state?: States;
  isMandatory?: boolean;
  tooltip?: string;
  floating?: boolean;
  validations?: ValidationRule[];
  cssStyles?: ControlCssStyles;
}

/**
 * Common base for every @op control. Owns the inputs/outputs and behaviour
 * shared across controls (label, mandatory marker, disabled handling,
 * automation-id, the `attribute` convenience setter) on top of the CVA base.
 */
@Directive()
export abstract class BaseComponent<T>
  extends BaseControlValueAccessor<T>
  implements OnInit, AfterViewInit
{
  protected readonly elementRef = inject(ElementRef);
  protected readonly renderer = inject(Renderer2);

  // --- Common inputs --------------------------------------------------------
  @Input() label = '';
  @Input() placeholder = '';
  @Input() readonly = false;
  @Input() floating = false;
  @Input() floatingClass = 'op-float-md';
  @Input() sizeClass = '';
  @Input() customClass = '';
  @Input() isMandatory = false;
  @Input() tooltip = '';
  @Input() appendTo = 'body';
  @Input() state: States = States.Default;
  @Input() attributeName = '';
  @Input() validations: ValidationRule[] = [];

  /** Sets an automation-id attribute on the host element. */
  @Input() id = '';

  @Input()
  set disabled(value: boolean) {
    this._disabled = value;
    if (value) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }
  get disabled(): boolean {
    return this._disabled;
  }
  private _disabled = false;

  /** Configure the whole control from one declarative object. */
  @Input()
  set attribute(attr: InputAttribute<T> | undefined) {
    if (!attr) {
      return;
    }
    if (attr.attributeName !== undefined) this.attributeName = attr.attributeName;
    if (attr.label !== undefined) this.label = attr.label;
    if (attr.placeholder !== undefined) this.placeholder = attr.placeholder;
    if (attr.readonly !== undefined) this.readonly = attr.readonly;
    if (attr.floating !== undefined) this.floating = attr.floating;
    if (attr.isMandatory !== undefined) this.isMandatory = attr.isMandatory;
    if (attr.tooltip !== undefined) this.tooltip = attr.tooltip;
    if (attr.state !== undefined) this.state = attr.state;
    if (attr.validations !== undefined) this.validations = attr.validations;
    if (attr.cssStyles) {
      if (attr.cssStyles.sizeClass !== undefined) this.sizeClass = attr.cssStyles.sizeClass;
      if (attr.cssStyles.floatingClass !== undefined)
        this.floatingClass = attr.cssStyles.floatingClass;
      if (attr.cssStyles.customClass !== undefined) this.customClass = attr.cssStyles.customClass;
    }
    if (attr.value !== undefined) this.value = attr.value;
    if (attr.disabled !== undefined) this.disabled = attr.disabled;
  }

  // --- Common outputs -------------------------------------------------------
  @Output('onClick') clickEvent = new EventEmitter<unknown>();
  @Output('onChange') changeEvent = new EventEmitter<unknown>();
  @Output('onBlur') blurEvent = new EventEmitter<unknown>();

  // --- Lifecycle ------------------------------------------------------------
  ngOnInit(): void {
    this.defineMandatory();
  }

  ngAfterViewInit(): void {
    this.defineAutomationId();
  }

  // --- Event relays ---------------------------------------------------------
  doClick(event: unknown): void {
    this.clickEvent.emit(event);
  }

  doChange(event: unknown): void {
    this.value = this.control.value;
    this.changeEvent.emit(event);
    this.onChange(this.control.value);
  }

  doBlur(event: unknown): void {
    this.onTouched();
    this.blurEvent.emit(event);
  }

  onClearClick(event?: unknown): void {
    this.control.setValue(null);
    this.value = null as unknown as T;
    this.changeEvent.emit(event);
    this.onChange(null as unknown as T);
  }

  /** True when the control currently holds a non-empty value. */
  hasValue(): boolean {
    const v = this.control.value;
    return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
  }

  // --- Helpers --------------------------------------------------------------

  /** Reads `validations`/`isMandatory` and applies a `required` validator. */
  protected defineMandatory(): void {
    const hasRequiredRule = this.validations?.some((rule) => rule.name === 'required');
    if (hasRequiredRule) {
      this.isMandatory = true;
    }
    if (this.isMandatory) {
      const existing = this.control.validator ? [this.control.validator] : [];
      this.control.setValidators([...existing, Validators.required]);
      this.control.updateValueAndValidity({ emitEvent: false });
    }
  }

  /** Stamps an `automation-id` attribute on the host element when `id` is set. */
  protected defineAutomationId(): void {
    const automationId = this.id || this.attributeName;
    if (automationId) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'automation-id', automationId);
    }
  }
}
