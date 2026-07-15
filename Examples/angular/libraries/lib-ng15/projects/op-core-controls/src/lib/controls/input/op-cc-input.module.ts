import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OpI18nModule } from '@op/i18n';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { OpCcFloatingLabelModule } from '../../floating-label/op-cc-floating-label.module';
import { OpCcInputComponent } from './op-cc-input.component';

@NgModule({
  declarations: [OpCcInputComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OpCcFloatingLabelModule,
    InputTextModule,
    TooltipModule,
    OpI18nModule,
  ],
  exports: [OpCcInputComponent],
})
export class OpCcInputModule {}
