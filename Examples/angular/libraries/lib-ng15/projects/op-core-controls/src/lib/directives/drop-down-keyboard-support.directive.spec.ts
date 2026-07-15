import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropDownKeyboardSupportDirective } from './drop-down-keyboard-support.directive';

@Component({
  template: `<div opDropDownKeyboardSupport tabindex="0">item</div>`,
})
class HostComponent {}

describe('DropDownKeyboardSupportDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostComponent, DropDownKeyboardSupportDirective],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should attach to the host element', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('div');
    expect(el).toBeTruthy();
  });

  it('should handle navigation keydown without throwing', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('div');
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    expect(() => el.dispatchEvent(event)).not.toThrow();
  });
});
