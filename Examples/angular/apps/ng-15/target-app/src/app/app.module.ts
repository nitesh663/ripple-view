import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { OpDynamicAggridModule } from '@op/dynamic';
import { OpCoreControlsModule } from '@op/core-controls';

import { AppComponent } from './app.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { TargetComponent } from './features/target/target.component';

@NgModule({
  declarations: [
    AppComponent,
    TopbarComponent,
    TargetComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    RouterModule.forRoot([]),
    StoreModule.forRoot({}),
    TranslateModule.forRoot(),
    OpDynamicAggridModule,
    OpCoreControlsModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
