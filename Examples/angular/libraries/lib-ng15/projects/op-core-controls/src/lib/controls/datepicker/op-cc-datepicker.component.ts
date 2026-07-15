import { Component, Input } from '@angular/core';

import { BaseComponent } from '../../component/base-component';

/**
 * Date picker control wrapping PrimeNG `<p-calendar>` behind the @op CVA base.
 */
@Component({
  selector: 'op-cc-datepicker',
  templateUrl: './op-cc-datepicker.view.html',
  styleUrls: ['./op-cc-datepicker.component.scss'],
})
export class OpCcDatepickerComponent extends BaseComponent<Date | Date[]> {
  /** Date display format (PrimeNG calendar format). */
  @Input() dateFormat = 'mm/dd/yy';
  /** Selection mode. */
  @Input() selectionMode: 'single' | 'range' | 'multiple' = 'single';
  /** Show the time picker. */
  @Input() showTime = false;
  /** Minimum selectable date. */
  @Input() minDate?: Date;
  /** Maximum selectable date. */
  @Input() maxDate?: Date;
  /** Show the calendar trigger icon. */
  @Input() showIcon = true;

  /** PrimeNG (onSelect) relay. */
  onSelect(event: unknown): void {
    this.doChange(event);
  }

  /** PrimeNG (onBlur) relay. */
  onCalendarBlur(event: unknown): void {
    this.doBlur(event);
  }
}
