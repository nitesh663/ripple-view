import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OpI18nModule } from '@op/i18n';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';

import { OpCcFloatingLabelModule } from '../../floating-label/op-cc-floating-label.module';
import { OpCcDatepickerComponent } from './op-cc-datepicker.component';

@NgModule({
  declarations: [OpCcDatepickerComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OpCcFloatingLabelModule,
    CalendarModule,
    TooltipModule,
    OpI18nModule,
  ],
  exports: [OpCcDatepickerComponent],
})
export class OpCcDatepickerModule {}
