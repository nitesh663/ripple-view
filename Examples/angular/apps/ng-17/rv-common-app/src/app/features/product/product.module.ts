import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { OpAgGridModule } from '@op/aggrid';
import { OpCoreControlsModule } from '@op/core-controls';

import { ProductShellComponent } from './product-shell.component';
import { ProductGridComponent } from './product-grid.component';
import { PackageComponent } from './package.component';

@NgModule({
  declarations: [ProductShellComponent, ProductGridComponent, PackageComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ProductShellComponent }]),
    OpAgGridModule,
    OpCoreControlsModule,
  ],
})
export class ProductModule {}
