import { NgModule } from '@angular/core';

import { OpCcFloatingLabelModule } from './floating-label/op-cc-floating-label.module';
import { SharedDirectivesModule } from './directives/shared-directives.module';
import { OpCcDropdownModule } from './controls/dropdown/op-cc-dropdown.module';
import { OpCcInputModule } from './controls/input/op-cc-input.module';
import { OpCcDatepickerModule } from './controls/datepicker/op-cc-datepicker.module';
import { OpCcMultiselectDropdownModule } from './controls/multiselect/op-cc-multiselect-dropdown.module';

/**
 * Umbrella module aggregating and re-exporting every @op control module plus
 * the floating-label and shared directives. Import this to get all four
 * controls at once, or import the individual control modules à la carte.
 */
@NgModule({
  imports: [
    OpCcFloatingLabelModule,
    SharedDirectivesModule,
    OpCcDropdownModule,
    OpCcInputModule,
    OpCcDatepickerModule,
    OpCcMultiselectDropdownModule,
  ],
  exports: [
    OpCcFloatingLabelModule,
    SharedDirectivesModule,
    OpCcDropdownModule,
    OpCcInputModule,
    OpCcDatepickerModule,
    OpCcMultiselectDropdownModule,
  ],
})
export class OpCoreControlsModule {}
