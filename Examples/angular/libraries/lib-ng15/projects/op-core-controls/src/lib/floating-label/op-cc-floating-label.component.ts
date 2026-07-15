import { Component, Input } from '@angular/core';

// Process-unique id source so each rendered label gets a stable, unique id a
// wrapped control can point its `aria-labelledby` at (A11y name association, G2).
let labelInstanceCount = 0;
function nextLabelId(): string {
  labelInstanceCount += 1;
  return `op-cc-label-${labelInstanceCount}`;
}

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
  /**
   * Stable unique id rendered on the `<label>`. A wrapped control whose
   * primitive cannot take a plain `aria-label` (e.g. p-calendar, p-multiSelect)
   * binds its `ariaLabelledBy` to this so the visible label IS its accessible
   * name (G2).
   */
  readonly labelId = nextLabelId();
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
