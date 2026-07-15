import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Title bar shown at the top of a sidebar panel: a translated title plus an
 * optional close affordance.
 */
@Component({
  selector: 'occ-filter-titlebar',
  templateUrl: './titlebar.component.html',
  styleUrls: ['./titlebar.component.scss'],
})
export class TitlebarComponent {
  /** Translate key for the title. */
  @Input() title = '';
  /** Show the close button. */
  @Input() showClose = true;

  /** Emitted when the close button is clicked. */
  @Output() closed = new EventEmitter<void>();
}
