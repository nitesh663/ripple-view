import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from '@ag-grid-community/core';

import { ActionRendererComponent } from './action-renderer.component';
import { TranslateModule } from '@ngx-translate/core';

import { ActionRendererParams, GridActionEvent } from '../../models/grid-action.model';

describe('ActionRendererComponent', () => {
  let component: ActionRendererComponent;
  let fixture: ComponentFixture<ActionRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActionRendererComponent],
      imports: [TranslateModule.forRoot()],
    }).compileComponents();
    fixture = TestBed.createComponent(ActionRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters actions by their visible() predicate', () => {
    component.agInit({
      data: { active: false },
      actions: [
        { id: 'edit', icon: 'pi pi-pencil' },
        {
          id: 'del',
          icon: 'pi pi-trash',
          visible: (p: ICellRendererParams) => (p.data as { active: boolean }).active,
        },
      ],
    } as unknown as ICellRendererParams & ActionRendererParams);
    expect(component.actions.length).toBe(1);
    expect(component.actions[0].id).toBe('edit');
  });

  it('emits the action through the onAction callback', () => {
    let received: GridActionEvent | undefined;
    component.agInit({
      data: { id: 1 },
      actions: [{ id: 'edit' }],
      onAction: (e: GridActionEvent) => (received = e),
    } as unknown as ICellRendererParams & ActionRendererParams);
    component.onActionClick(component.actions[0], new MouseEvent('click'));
    expect(received?.action.id).toBe('edit');
    expect(received?.data).toEqual({ id: 1 });
  });
});
