import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { StoreModule } from '@ngrx/store';
import { OpI18nModule } from '@op/i18n';
import { OpCoreControlsModule } from '@op/core-controls';
import { OpAgGridModule } from '@op/aggrid';
import { OpDynamicAggridModule } from '@op/dynamic';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { createTranslateLoader } from './i18n/translate-loader.factory';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { CodeSnippetComponent } from './shared/code-snippet/code-snippet.component';
import { DropdownViewerComponent } from './viewers/dropdown-viewer/dropdown-viewer.component';
import { InputViewerComponent } from './viewers/input-viewer/input-viewer.component';
import { DatepickerViewerComponent } from './viewers/datepicker-viewer/datepicker-viewer.component';
import { MultiselectViewerComponent } from './viewers/multiselect-viewer/multiselect-viewer.component';
import { GridViewerComponent } from './viewers/grid-viewer/grid-viewer.component';
import { DynamicGridViewerComponent } from './viewers/dynamic-grid-viewer/dynamic-grid-viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    CodeSnippetComponent,
    DropdownViewerComponent,
    InputViewerComponent,
    DatepickerViewerComponent,
    MultiselectViewerComponent,
    GridViewerComponent,
    DynamicGridViewerComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    OpI18nModule.forRoot(),
    OpCoreControlsModule,
    StoreModule.forRoot({}),
    OpAgGridModule,
    OpDynamicAggridModule,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
  bootstrap: [AppComponent],
})
export class AppModule {}
