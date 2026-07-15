import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  closeSharedBrowser,
  executor,
  launchSharedBrowser,
  loadPage,
  locator,
  match,
} from './test-helpers.js';

// AC1: text-input, check/uncheck, drag-to, and select-option actions.
// Split from PlaywrightStepExecutor.actions.test.ts to keep each file
// under the repo's 200-line guideline; shares the same real-Chromium
// harness and conventions (G13).

beforeAll(async () => {
  await launchSharedBrowser();
});

afterAll(async () => {
  await closeSharedBrowser();
});

describe('PlaywrightStepExecutor — AC1: text-input actions', () => {
  const FORM_HTML = '<label for="name-field">Name</label><input id="name-field" value="Ada" />';

  it('type-into resolves by label and fills the value', async () => {
    const page = await loadPage(FORM_HTML);

    await executor.execute(
      'I type "Grace" into the field "Name"',
      match('type-into', { text: 'Grace', label: 'Name' }),
      locator,
      page,
    );

    expect(await page.locator('input').inputValue()).toBe('Grace');
    await page.close();
  });

  it('clear-field resolves by label and clears the value', async () => {
    const page = await loadPage(FORM_HTML);

    await executor.execute(
      'I clear the field "Name"',
      match('clear-field', { label: 'Name' }),
      locator,
      page,
    );

    expect(await page.locator('input').inputValue()).toBe('');
    await page.close();
  });
});

describe('PlaywrightStepExecutor — AC1: check / uncheck', () => {
  it('check resolves the checkbox by name and checks it', async () => {
    const page = await loadPage('<label><input type="checkbox" />Agree</label>');

    await executor.execute(
      'I check the checkbox "Agree"',
      match('check', { name: 'Agree' }),
      locator,
      page,
    );

    expect(await page.locator('input[type=checkbox]').isChecked()).toBe(true);
    await page.close();
  });

  it('uncheck resolves the checkbox by name and unchecks it', async () => {
    const page = await loadPage('<label><input type="checkbox" checked />Agree</label>');

    await executor.execute(
      'I uncheck the checkbox "Agree"',
      match('uncheck', { name: 'Agree' }),
      locator,
      page,
    );

    expect(await page.locator('input[type=checkbox]').isChecked()).toBe(false);
    await page.close();
  });
});

describe('PlaywrightStepExecutor — AC1: drag-to', () => {
  it('drags the source element onto the text-resolved target', async () => {
    const page = await loadPage(`
      <div role="button" draggable="true" id="source"
           ondragstart="event.dataTransfer.setData('text','x')">Card</div>
      <div id="target" ondragover="event.preventDefault()"
           ondrop="this.textContent='Dropped'">Target Zone</div>
    `);

    await executor.execute(
      'I drag the button "Card" to "Target Zone"',
      match('drag-to', { role: 'button', name: 'Card', target: 'Target Zone' }),
      locator,
      page,
    );

    expect(await page.locator('#target').textContent()).toBe('Dropped');
    await page.close();
  });
});

describe('PlaywrightStepExecutor — AC1: select-option (native <select> vs ARIA combobox)', () => {
  it('selects a native <select> option via selectOption()', async () => {
    const page = await loadPage(`
      <label for="color">Color</label>
      <select id="color">
        <option value="r">Red</option>
        <option value="b">Blue</option>
      </select>
    `);

    await executor.execute(
      'I select "Blue" from "Color"',
      match('select-option', { option: 'Blue', label: 'Color' }),
      locator,
      page,
    );

    expect(await page.locator('select').inputValue()).toBe('b');
    await page.close();
  });

  it('falls back to the ARIA combobox pattern: click to open, then click the resolved option', async () => {
    const page = await loadPage(`
      <label id="color-label">Color</label>
      <div id="color" role="combobox" aria-expanded="false" aria-labelledby="color-label"
           onclick="this.nextElementSibling.hidden=false">Choose</div>
      <ul role="listbox" hidden>
        <li role="option" onclick="document.getElementById('color').textContent=this.textContent">Blue</li>
      </ul>
    `);

    await executor.execute(
      'I select "Blue" from "Color"',
      match('select-option', { option: 'Blue', label: 'Color' }),
      locator,
      page,
    );

    expect(await page.locator('#color').textContent()).toBe('Blue');
    await page.close();
  });
});
