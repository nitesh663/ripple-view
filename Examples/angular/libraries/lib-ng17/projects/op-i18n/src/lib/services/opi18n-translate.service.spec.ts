import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { OPi18nTranslateService } from './opi18n-translate.service';

describe('OPi18nTranslateService', () => {
  let service: OPi18nTranslateService;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [OPi18nTranslateService],
    });
    service = TestBed.inject(OPi18nTranslateService);
    translate = TestBed.inject(TranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set the default language and resolve translations synchronously', () => {
    translate.setTranslation('en', { GREETING: 'Hello' });
    service.setDefaultLang('en');
    service.use('en');
    expect(service.instant('GREETING')).toBe('Hello');
    expect(service.currentLang).toBe('en');
  });

  it('should resolve translations asynchronously', (done: DoneFn) => {
    translate.setTranslation('en', { BYE: 'Goodbye' });
    service.use('en');
    service.get('BYE').subscribe((value) => {
      expect(value).toBe('Goodbye');
      done();
    });
  });
});
