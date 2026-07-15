import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { OpCoreControlsModule } from '@op/core-controls';
import { Observable, of } from 'rxjs';

/**
 * Static, in-memory translation loader so the `| translate` pipe is fully wired
 * inside Storybook without needing HTTP. Stories pass human-readable labels
 * directly, so unknown keys fall through to their literal text; the few keys
 * below demonstrate real translation resolution.
 */
class StorybookTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<Record<string, unknown>> {
    return of({
      DROPDOWN: { LABEL: 'Country', PLACEHOLDER: 'Select a country' },
      INPUT: { LABEL: 'Full name', PLACEHOLDER: 'Enter your name' },
      DATEPICKER: { LABEL: 'Date of birth', PLACEHOLDER: 'Pick a date' },
      MULTISELECT: { LABEL: 'Skills', PLACEHOLDER: 'Select skills' },
    });
  }
}

/**
 * Reusable NgModule metadata for stories. Spread into a story's
 * `moduleMetadata` so each control renders with its real module, the translate
 * pipe, reactive-forms wiring and animations.
 */
export const sharedModuleMetadata = {
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: { provide: TranslateLoader, useClass: StorybookTranslateLoader },
    }),
    OpCoreControlsModule,
  ],
};

/**
 * Application-level providers (standalone-style) usable via Storybook's
 * `applicationConfig` decorator when a story prefers providers over imports.
 */
export const sharedAppProviders = [
  importProvidersFrom(
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: { provide: TranslateLoader, useClass: StorybookTranslateLoader },
    }),
    OpCoreControlsModule,
  ),
];
