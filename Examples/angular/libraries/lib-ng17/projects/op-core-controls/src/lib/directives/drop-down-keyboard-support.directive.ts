import { Directive, HostListener } from '@angular/core';

/**
 * Adds basic keyboard affordances to dropdown-like controls. For Milestone 1
 * this is a lightweight pass-through: it ensures Enter/Space/Arrow keys are not
 * swallowed and provides a single place to grow richer keyboard navigation
 * later (typeahead, home/end, etc.).
 */
@Directive({
  selector: '[opDropDownKeyboardSupport]',
})
export class DropDownKeyboardSupportDirective {
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const navigationKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End', 'Escape'];
    if (navigationKeys.includes(event.key)) {
      // Let PrimeNG's own handlers run; we simply avoid blocking them and keep
      // a hook point for future custom navigation.
      event.stopPropagation();
    }
  }
}
