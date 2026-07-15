import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { RequireInfoComponent } from './require-info.component';

describe('RequireInfoComponent', () => {
  let component: RequireInfoComponent;
  let fixture: ComponentFixture<RequireInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RequireInfoComponent],
      imports: [TranslateModule.forRoot()],
    }).compileComponents();
    fixture = TestBed.createComponent(RequireInfoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the message', () => {
    component.message = 'grid.filter.empty';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('grid.filter.empty');
  });
});
