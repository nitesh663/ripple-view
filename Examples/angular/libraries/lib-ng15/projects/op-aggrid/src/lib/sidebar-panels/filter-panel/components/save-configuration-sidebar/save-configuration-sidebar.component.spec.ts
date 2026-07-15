import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { SaveConfigurationSidebarComponent } from './save-configuration-sidebar.component';
import { SaveFilterPayload } from '../../models/save-filter.model';

describe('SaveConfigurationSidebarComponent', () => {
  let component: SaveConfigurationSidebarComponent;
  let fixture: ComponentFixture<SaveConfigurationSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SaveConfigurationSidebarComponent],
      imports: [FormsModule, TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SaveConfigurationSidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not allow saving without a name', () => {
    component.name = '   ';
    expect(component.canSave).toBeFalse();
  });

  it('emits a save payload on submit', () => {
    let payload: SaveFilterPayload | undefined;
    component.save.subscribe((p) => (payload = p));
    component.filterBarPanelId = 'orders';
    component.values = { status: 'open' };
    component.name = 'My View';
    component.onSubmit();
    expect(payload).toEqual({
      name: 'My View',
      filterBarPanelId: 'orders',
      values: { status: 'open' },
      isDefault: false,
    });
  });
});
