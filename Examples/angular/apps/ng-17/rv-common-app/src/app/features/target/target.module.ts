import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OpDynamicAggridModule } from '@op/dynamic';
import { OpCoreControlsModule } from '@op/core-controls';

import { TargetShellComponent } from './target-shell.component';

@NgModule({
  declarations: [TargetShellComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: TargetShellComponent }]),
    OpDynamicAggridModule,
    OpCoreControlsModule,
  ],
})
export class TargetModule {}
