import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OpI18nModule } from '@op/i18n';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';

import { OpCcFloatingLabelModule } from '../../floating-label/op-cc-floating-label.module';
import { SharedDirectivesModule } from '../../directives/shared-directives.module';
import { OpCcDropdownComponent } from './op-cc-dropdown.component';

@NgModule({
  declarations: [OpCcDropdownComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OpCcFloatingLabelModule,
    DropdownModule,
    TooltipModule,
    OpI18nModule,
    SharedDirectivesModule,
  ],
  exports: [OpCcDropdownComponent],
})
export class OpCcDropdownModule {}
