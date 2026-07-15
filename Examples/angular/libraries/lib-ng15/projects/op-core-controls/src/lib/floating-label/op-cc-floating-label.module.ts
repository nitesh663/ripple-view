import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpI18nModule } from '@op/i18n';
import { TooltipModule } from 'primeng/tooltip';

import { OpCcFloatingLabelComponent } from './op-cc-floating-label.component';

@NgModule({
  declarations: [OpCcFloatingLabelComponent],
  imports: [CommonModule, TooltipModule, OpI18nModule],
  exports: [OpCcFloatingLabelComponent],
})
export class OpCcFloatingLabelModule {}
