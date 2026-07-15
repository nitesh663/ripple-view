import { Component, Input } from '@angular/core';

/**
 * Inline informational / empty-state message shown inside a sidebar panel, e.g.
 * "select a filter to continue" or "no saved filters yet".
 */
@Component({
  selector: 'occ-require-info',
  templateUrl: './require-info.component.html',
  styleUrls: ['./require-info.component.scss'],
})
export class RequireInfoComponent {
  /** Translate key for the message. */
  @Input() message = '';
  /** PrimeIcon class for the leading icon. */
  @Input() icon = 'pi pi-info-circle';
}
