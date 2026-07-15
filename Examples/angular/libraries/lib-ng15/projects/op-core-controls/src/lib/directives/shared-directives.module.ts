import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { DropDownKeyboardSupportDirective } from './drop-down-keyboard-support.directive';

@NgModule({
  declarations: [DropDownKeyboardSupportDirective],
  imports: [CommonModule],
  exports: [DropDownKeyboardSupportDirective],
})
export class SharedDirectivesModule {}
