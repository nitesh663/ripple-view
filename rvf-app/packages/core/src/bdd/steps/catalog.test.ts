import { describe, it, expect } from 'vitest';
import { StepRegistry } from './registry.js';

const registry = new StepRegistry();

// Navigation
describe(' Navigation patterns', () => {
  it('navigate: I am on route "/home"', () => {
    const m = registry.match('I am on route "/home"');
    expect(m?.action).toBe('navigate');
    expect(m?.params).toEqual({ route: '/home' });
  });

  it('scope-region: within the "main-nav" region', () => {
    const m = registry.match('within the "main-nav" region');
    expect(m?.action).toBe('scope-region');
    expect(m?.params).toEqual({ region: 'main-nav' });
  });

  it('assert-mounted: a button is mounted', () => {
    const m = registry.match('a button is mounted');
    expect(m?.action).toBe('assert-mounted');
    expect(m?.params).toEqual({ component: 'button' });
  });
});

// Data
describe(' Data patterns', () => {
  it('seed-data grid: a grid with at least 5 rows', () => {
    const m = registry.match('a grid with at least 5 rows');
    expect(m?.action).toBe('seed-data');
    expect(m?.params).toEqual({ kind: 'grid', count: 5 });
  });

  it('seed-data ref: seeded data users', () => {
    const m = registry.match('seeded data users');
    expect(m?.action).toBe('seed-data');
    expect(m?.params).toEqual({ kind: 'ref', ref: 'users' });
  });
});

// Actions
describe(' Action patterns', () => {
  it('activate: I activate the button "Submit"', () => {
    const m = registry.match('I activate the button "Submit"');
    expect(m?.action).toBe('activate');
    expect(m?.params).toEqual({ role: 'button', name: 'Submit' });
  });

  it('type-into: I type "hello" into the field "Username"', () => {
    const m = registry.match('I type "hello" into the field "Username"');
    expect(m?.action).toBe('type-into');
    expect(m?.params).toEqual({ text: 'hello', label: 'Username' });
  });

  it('select-option: I select "Option A" from "Dropdown"', () => {
    const m = registry.match('I select "Option A" from "Dropdown"');
    expect(m?.action).toBe('select-option');
    expect(m?.params).toEqual({ option: 'Option A', label: 'Dropdown' });
  });

  it('toggle: I toggle the checkbox "Remember me"', () => {
    const m = registry.match('I toggle the checkbox "Remember me"');
    expect(m?.action).toBe('toggle');
    expect(m?.params).toEqual({ role: 'checkbox', name: 'Remember me' });
  });

  it('expand: I expand "Details"', () => {
    const m = registry.match('I expand "Details"');
    expect(m?.action).toBe('expand');
    expect(m?.params).toEqual({ name: 'Details' });
  });

  it('hover: I hover the link "Help"', () => {
    const m = registry.match('I hover the link "Help"');
    expect(m?.action).toBe('hover');
    expect(m?.params).toEqual({ role: 'link', name: 'Help' });
  });

  it('focus: I focus the input "Email"', () => {
    const m = registry.match('I focus the input "Email"');
    expect(m?.action).toBe('focus');
    expect(m?.params).toEqual({ role: 'input', name: 'Email' });
  });

  it('press-key: I press "Enter"', () => {
    const m = registry.match('I press "Enter"');
    expect(m?.action).toBe('press-key');
    expect(m?.params).toEqual({ key: 'Enter' });
  });
});

// Assertions
describe(' Assertion patterns', () => {
  it('assert-visible: the button "Submit" is visible', () => {
    const m = registry.match('the button "Submit" is visible');
    expect(m?.action).toBe('assert-visible');
    expect(m?.params).toEqual({ role: 'button', name: 'Submit' });
  });

  it('assert-enabled: the button "Submit" is enabled', () => {
    const m = registry.match('the button "Submit" is enabled');
    expect(m?.action).toBe('assert-enabled');
    expect(m?.params).toEqual({ role: 'button', name: 'Submit' });
  });

  it('assert-disabled: the button "Submit" is disabled', () => {
    const m = registry.match('the button "Submit" is disabled');
    expect(m?.action).toBe('assert-disabled');
    expect(m?.params).toEqual({ role: 'button', name: 'Submit' });
  });

  it('assert-text: the text "Hello World" is shown', () => {
    const m = registry.match('the text "Hello World" is shown');
    expect(m?.action).toBe('assert-text');
    expect(m?.params).toEqual({ value: 'Hello World' });
  });

  it('assert-selection: the selection equals "Option A"', () => {
    const m = registry.match('the selection equals "Option A"');
    expect(m?.action).toBe('assert-selection');
    expect(m?.params).toEqual({ value: 'Option A' });
  });

  it('assert-count: the button count equals 3', () => {
    const m = registry.match('the button count equals 3');
    expect(m?.action).toBe('assert-count');
    expect(m?.params).toEqual({ role: 'button', count: 3 });
  });

  it('assert-no-overlap: "Header" does not overlap "Footer"', () => {
    const m = registry.match('"Header" does not overlap "Footer"');
    expect(m?.action).toBe('assert-no-overlap');
    expect(m?.params).toEqual({ a: 'Header', b: 'Footer' });
  });

  it('assert-in-viewport: the "Banner" is within the viewport', () => {
    const m = registry.match('the "Banner" is within the viewport');
    expect(m?.action).toBe('assert-in-viewport');
    expect(m?.params).toEqual({ name: 'Banner' });
  });

  it('assert-attribute: the attribute "aria-label" of button "Close" equals "Dismiss"', () => {
    const m = registry.match('the attribute "aria-label" of button "Close" equals "Dismiss"');
    expect(m?.action).toBe('assert-attribute');
    expect(m?.params).toEqual({
      attr: 'aria-label',
      role: 'button',
      name: 'Close',
      value: 'Dismiss',
    });
  });

  it('assert-url: the URL is "/dashboard"', () => {
    const m = registry.match('the URL is "/dashboard"');
    expect(m?.action).toBe('assert-url');
    expect(m?.params).toEqual({ route: '/dashboard' });
  });
});

// Extended actions
describe(' Extended action patterns', () => {
  it('double-click: I double-click the row "Item 1"', () => {
    const m = registry.match('I double-click the row "Item 1"');
    expect(m?.action).toBe('double-click');
    expect(m?.params).toEqual({ role: 'row', name: 'Item 1' });
  });

  it('right-click: I right-click the button "More options"', () => {
    const m = registry.match('I right-click the button "More options"');
    expect(m?.action).toBe('right-click');
    expect(m?.params).toEqual({ role: 'button', name: 'More options' });
  });

  it('click-menu-item: I click the menu item "Delete"', () => {
    const m = registry.match('I click the menu item "Delete"');
    expect(m?.action).toBe('click-menu-item');
    expect(m?.params).toEqual({ name: 'Delete' });
  });

  it('scroll-to: I scroll to the button "Save"', () => {
    const m = registry.match('I scroll to the button "Save"');
    expect(m?.action).toBe('scroll-to');
    expect(m?.params).toEqual({ role: 'button', name: 'Save' });
  });

  it('scroll-page down: I scroll down by 300 pixels', () => {
    const m = registry.match('I scroll down by 300 pixels');
    expect(m?.action).toBe('scroll-page');
    expect(m?.params).toEqual({ direction: 'down', pixels: 300 });
  });

  it('scroll-page up: I scroll up by 100 pixels', () => {
    const m = registry.match('I scroll up by 100 pixels');
    expect(m?.action).toBe('scroll-page');
    expect(m?.params).toEqual({ direction: 'up', pixels: 100 });
  });

  it('clear-field: I clear the field "Search"', () => {
    const m = registry.match('I clear the field "Search"');
    expect(m?.action).toBe('clear-field');
    expect(m?.params).toEqual({ label: 'Search' });
  });

  it('drag-to: I drag the row "Task A" to "Done"', () => {
    const m = registry.match('I drag the row "Task A" to "Done"');
    expect(m?.action).toBe('drag-to');
    expect(m?.params).toEqual({ role: 'row', name: 'Task A', target: 'Done' });
  });

  it('check: I check the checkbox "Remember me"', () => {
    const m = registry.match('I check the checkbox "Remember me"');
    expect(m?.action).toBe('check');
    expect(m?.params).toEqual({ name: 'Remember me' });
  });

  it('uncheck: I uncheck the checkbox "Remember me"', () => {
    const m = registry.match('I uncheck the checkbox "Remember me"');
    expect(m?.action).toBe('uncheck');
    expect(m?.params).toEqual({ name: 'Remember me' });
  });
});

// Registry behaviour
describe('StepRegistry behaviour', () => {
  it('returns null for an unrecognised step', () => {
    expect(registry.match('something completely unknown')).toBeNull();
  });

  it('size equals the total catalog count', () => {
    expect(registry.size).toBe(39); // 3 + 2 + 17 + 11 + 3 + 3
  });

  it('accepts extra patterns and increases size', () => {
    const extra = [
      {
        pattern: /^custom step "(?<val>[^"]+)"$/,
        action: 'navigate' as const,
        extractParams: (m: RegExpExecArray) => ({ route: m.groups?.['val'] ?? '' }),
      },
    ];
    const extended = new StepRegistry(extra);
    expect(extended.size).toBe(40);
    expect(extended.match('custom step "foo"')?.action).toBe('navigate');
  });
});
