import { Component, Input, TemplateRef } from '@angular/core';
import { SelectItem } from 'primeng/api';

import { BaseComponent } from '../../component/base-component';

/**
 * Dropdown control wrapping PrimeNG `<p-dropdown>` behind the @op CVA base.
 */
@Component({
  selector: 'op-cc-dropdown',
  templateUrl: './op-cc-dropdown.view.html',
  styleUrls: ['./op-cc-dropdown.component.scss'],
})
export class OpCcDropdownComponent extends BaseComponent<unknown> {
  /** Whether to allow free-text editing of the selected value. */
  @Input() editable = false;
  /** Show PrimeNG's built-in clear icon (we also render our own). */
  @Input() showClear = false;
  /** Enable the filter/search box in the panel. */
  @Input() isFilter = false;
  /** Enable typeahead behaviour. */
  @Input() isTypeAhead = false;
  /** Custom template for an option row. */
  @Input() itemTemplate?: TemplateRef<unknown>;
  /** Custom template for the selected value. */
  @Input() selectedItemTemplate?: TemplateRef<unknown>;

  private _options: SelectItem[] = [];

  /** Options list; optionally sorted alphabetically by label. */
  @Input()
  set options(opts: SelectItem[]) {
    const list = opts ?? [];
    this._options = this.sortAlphabetically
      ? [...list].sort((a, b) => String(a.label ?? '').localeCompare(String(b.label ?? '')))
      : list;
  }
  get options(): SelectItem[] {
    return this._options;
  }

  /** When true the options setter sorts entries alphabetically by label. */
  @Input() sortAlphabetically = false;

  /** Delayed external selection — writes the value on the next tick. */
  @Input()
  set selection(value: unknown) {
    setTimeout(() => this.writeValue(value), 0);
  }

  /** Mirrors `isFilter` for the PrimeNG `[filter]` binding. */
  get filter(): boolean {
    return this.isFilter;
  }

  /** PrimeNG (onHide) relay — treated as a blur for forms. */
  onDropdownHide(event: unknown): void {
    this.doBlur(event);
  }

  /** PrimeNG (onClick) relay. */
  onClick(event: unknown): void {
    this.doClick(event);
  }
}
