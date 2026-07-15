import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { TitlebarComponent } from './titlebar.component';

describe('TitlebarComponent', () => {
  let component: TitlebarComponent;
  let fixture: ComponentFixture<TitlebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TitlebarComponent],
      imports: [TranslateModule.forRoot()],
    }).compileComponents();
    fixture = TestBed.createComponent(TitlebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits closed when the close button is clicked', () => {
    const spy = jasmine.createSpy('closed');
    component.closed.subscribe(spy);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.occ-titlebar__close').click();
    expect(spy).toHaveBeenCalled();
  });
});
