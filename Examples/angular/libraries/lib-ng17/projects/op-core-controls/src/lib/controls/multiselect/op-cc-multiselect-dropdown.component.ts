import { Component, Input, TemplateRef } from '@angular/core';
import { SelectItem } from 'primeng/api';

import { BaseComponent } from '../../component/base-component';

/**
 * Multi-select control wrapping PrimeNG `<p-multiSelect>` behind the @op CVA base.
 */
@Component({
  selector: 'op-cc-multiselect-dropdown',
  templateUrl: './op-cc-multiselect-dropdown.view.html',
  styleUrls: ['./op-cc-multiselect-dropdown.component.scss'],
})
export class OpCcMultiselectDropdownComponent extends BaseComponent<unknown[]> {
  /** Selectable options. */
  @Input() options: SelectItem[] = [];
  /** Show the select-all toggle in the header. */
  @Input() showToggleAll = true;
  /** Show the panel header (filter + toggle-all). */
  @Input() showHeader = true;
  /** Enable the filter box. */
  @Input() filter = true;
  /** Maximum number of selected labels shown before summarising. */
  @Input() maxSelectedLabels = 3;
  /** How selected values are displayed. */
  @Input() display: 'comma' | 'chip' = 'comma';
  /** Custom option-row template. */
  @Input() itemTemplate?: TemplateRef<unknown>;

  /** PrimeNG (onChange) relay. */
  onSelectionChange(event: unknown): void {
    this.doChange(event);
  }

  /** PrimeNG (onPanelHide) relay → treated as blur. */
  onPanelHide(event: unknown): void {
    this.doBlur(event);
  }
}
