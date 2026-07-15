import { Component, Input } from '@angular/core';

/**
 * Presentational wrapper that renders a (optionally floating) label with a
 * mandatory marker and tooltip around projected control content.
 */
@Component({
  selector: 'op-cc-floating-label',
  templateUrl: './op-cc-floating-label.component.html',
  styleUrls: ['./op-cc-floating-label.component.scss'],
})
export class OpCcFloatingLabelComponent {
  /** Visible label text (passed through the translate pipe in the template). */
  @Input() label = '';
  /** Renders the red `*` mandatory marker when true. */
  @Input() isMandatory = false;
  /** Tooltip text shown on an info icon next to the label. */
  @Input() tooltip = '';
  /** Enables PrimeNG-style floating-label behaviour. */
  @Input() floating = false;
  /** Floating modifier class (e.g. 'op-float-md'). */
  @Input() floatingClass = 'op-float-md';
  /** Optional id linking the label to its control via `for`. */
  @Input() labelFor = '';
}
