import { Component, Input } from '@angular/core';

import { BaseComponent } from '../../component/base-component';

/**
 * Text input control wrapping `<input pInputText>` behind the @op CVA base.
 */
@Component({
  selector: 'op-cc-input',
  templateUrl: './op-cc-input.view.html',
  styleUrls: ['./op-cc-input.component.scss'],
})
export class OpCcInputComponent extends BaseComponent<string> {
  /** HTML input type (text, email, password, number, …). */
  @Input() type = 'text';
  /** Maximum number of characters. */
  @Input() maxLength: number | null = null;

  /** (input) relay → forms change. */
  onInput(event: unknown): void {
    this.doChange(event);
  }

  /** (blur) relay → forms touched/blur. */
  onBlur(event: unknown): void {
    this.doBlur(event);
  }
}
