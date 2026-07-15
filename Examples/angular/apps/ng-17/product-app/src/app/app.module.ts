import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { TranslateModule } from '@ngx-translate/core';
import { OpAgGridModule } from '@op/aggrid';
import { OpCoreControlsModule } from '@op/core-controls';

import { AppComponent } from './app.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { ProductComponent } from './features/product/product.component';
import { PackageComponent } from './features/package/package.component';

@NgModule({
  declarations: [
    AppComponent,
    TopbarComponent,
    ProductComponent,
    PackageComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    RouterModule.forRoot([]),
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    TranslateModule.forRoot(),
    OpAgGridModule,
    OpCoreControlsModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
