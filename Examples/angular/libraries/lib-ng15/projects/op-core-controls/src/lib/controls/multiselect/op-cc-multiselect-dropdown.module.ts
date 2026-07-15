import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OpI18nModule } from '@op/i18n';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';

import { OpCcFloatingLabelModule } from '../../floating-label/op-cc-floating-label.module';
import { SharedDirectivesModule } from '../../directives/shared-directives.module';
import { OpCcMultiselectDropdownComponent } from './op-cc-multiselect-dropdown.component';

@NgModule({
  declarations: [OpCcMultiselectDropdownComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OpCcFloatingLabelModule,
    MultiSelectModule,
    TooltipModule,
    OpI18nModule,
    SharedDirectivesModule,
  ],
  exports: [OpCcMultiselectDropdownComponent],
})
export class OpCcMultiselectDropdownModule {}
