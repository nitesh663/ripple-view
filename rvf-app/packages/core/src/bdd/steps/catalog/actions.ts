import type { StepPattern } from '../types.js';

// Action patterns

const activate: StepPattern = {
  pattern: /^I activate the (?<role>\S+) "(?<name>[^"]+)"$/,
  action: 'activate',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const typeInto: StepPattern = {
  pattern: /^I type "(?<text>[^"]+)" into the field "(?<label>[^"]+)"$/,
  action: 'type-into',
  extractParams(match) {
    return { text: match.groups?.['text'] ?? '', label: match.groups?.['label'] ?? '' };
  },
};

const selectOption: StepPattern = {
  pattern: /^I select "(?<option>[^"]+)" from "(?<label>[^"]+)"$/,
  action: 'select-option',
  extractParams(match) {
    return { option: match.groups?.['option'] ?? '', label: match.groups?.['label'] ?? '' };
  },
};

const toggle: StepPattern = {
  pattern: /^I toggle the (?<role>\S+) "(?<name>[^"]+)"$/,
  action: 'toggle',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const expand: StepPattern = {
  pattern: /^I expand "(?<name>[^"]+)"$/,
  action: 'expand',
  extractParams(match) {
    return { name: match.groups?.['name'] ?? '' };
  },
};

const hover: StepPattern = {
  pattern: /^I hover the (?<role>\S+) "(?<name>[^"]+)"$/,
  action: 'hover',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const focus: StepPattern = {
  pattern: /^I focus the (?<role>\S+) "(?<name>[^"]+)"$/,
  action: 'focus',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const pressKey: StepPattern = {
  pattern: /^I press "(?<key>[^"]+)"$/,
  action: 'press-key',
  extractParams(match) {
    return { key: match.groups?.['key'] ?? '' };
  },
};

const doubleClick: StepPattern = {
  pattern: /^I double-click the (?<role>\S+) "(?<name>[^"]+)"$/,
  action: 'double-click',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const rightClick: StepPattern = {
  pattern: /^I right-click the (?<role>\S+) "(?<name>[^"]+)"$/,
  action: 'right-click',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const clickMenuItem: StepPattern = {
  pattern: /^I click the menu item "(?<name>[^"]+)"$/,
  action: 'click-menu-item',
  extractParams(match) {
    return { name: match.groups?.['name'] ?? '' };
  },
};

const scrollTo: StepPattern = {
  pattern: /^I scroll to the (?<role>\S+) "(?<name>[^"]+)"$/,
  action: 'scroll-to',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const scrollPage: StepPattern = {
  pattern: /^I scroll (?<direction>up|down) by (?<pixels>\d+) pixels$/,
  action: 'scroll-page',
  extractParams(match) {
    return {
      direction: match.groups?.['direction'] ?? 'down',
      pixels: Number(match.groups?.['pixels'] ?? '0'),
    };
  },
};

const clearField: StepPattern = {
  pattern: /^I clear the field "(?<label>[^"]+)"$/,
  action: 'clear-field',
  extractParams(match) {
    return { label: match.groups?.['label'] ?? '' };
  },
};

const dragTo: StepPattern = {
  pattern: /^I drag the (?<role>\S+) "(?<name>[^"]+)" to "(?<target>[^"]+)"$/,
  action: 'drag-to',
  extractParams(match) {
    return {
      role: match.groups?.['role'] ?? '',
      name: match.groups?.['name'] ?? '',
      target: match.groups?.['target'] ?? '',
    };
  },
};

const check: StepPattern = {
  pattern: /^I check the checkbox "(?<name>[^"]+)"$/,
  action: 'check',
  extractParams(match) {
    return { name: match.groups?.['name'] ?? '' };
  },
};

const uncheck: StepPattern = {
  pattern: /^I uncheck the checkbox "(?<name>[^"]+)"$/,
  action: 'uncheck',
  extractParams(match) {
    return { name: match.groups?.['name'] ?? '' };
  },
};

export const actionPatterns: StepPattern[] = [
  activate,
  typeInto,
  selectOption,
  toggle,
  expand,
  hover,
  focus,
  pressKey,
  doubleClick,
  rightClick,
  clickMenuItem,
  scrollTo,
  scrollPage,
  clearField,
  dragTo,
  check,
  uncheck,
];
