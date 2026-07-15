import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { StepMatch } from '@rippleview/core';
import { StepExecutionError } from '@rippleview/core';
import { PlaywrightStepExecutor } from './PlaywrightStepExecutor.js';
import { PlaywrightLocatorStrategy } from '../locator/PlaywrightLocatorStrategy.js';
import { PlaywrightDialogPolicy } from '../dialog/PlaywrightDialogPolicy.js';
import { closeHarness, launchHarness, loadFixture } from '../dialog/test-helpers.js';

// DoD (): a real fixture that opens window.confirm() completes
// without hanging and produces a correct verdict — driven entirely
// through PlaywrightStepExecutor.execute(), exactly as a scenario runner
// would call it step by step (AC1).
//
// Ordering requirement (see PlaywrightDialogPolicy's module doc for why):
// `I accept the dialog` / `I dismiss the dialog` MUST execute BEFORE the
// action that triggers the dialog. The Gherkin shape that actually works
// is:
//   Given I accept the dialog
//   When I activate the button "Delete"
// NOT the other order — by the time a step "after" the click could run,
// the click's own `await` is already blocked waiting on the open dialog,
// so there is no way to react to it after the fact.

beforeAll(async () => {
  await launchHarness();
});

afterAll(async () => {
  await closeHarness();
});

const locator = new PlaywrightLocatorStrategy();

function match(action: StepMatch['action'], params: StepMatch['params']): StepMatch {
  return { action, params };
}

const CONFIRM_PAGE = `
  <button>Delete</button>
  <p id="result">pending</p>
  <script>
    document.querySelector('button').addEventListener('click', () => {
      const accepted = window.confirm('Delete this record?');
      document.getElementById('result').textContent = accepted ? 'deleted' : 'kept';
    });
  </script>
`;

describe('DoD: a real window.confirm() fixture completes without hanging, with a correct verdict', () => {
  it('arming accept BEFORE the click lets the confirm()-guarded action proceed', async () => {
    const executor = new PlaywrightStepExecutor();
    const dialogPolicy = new PlaywrightDialogPolicy();
    const page = await loadFixture(CONFIRM_PAGE);
    dialogPolicy.start(page);

    // Given I accept the dialog
    await executor.execute(
      'I accept the dialog',
      match('accept-dialog', {}),
      locator,
      page,
      undefined,
      dialogPolicy,
    );

    // When I activate the button "Delete"
    await executor.execute(
      'I activate the button "Delete"',
      match('activate', { role: 'button', name: 'Delete' }),
      locator,
      page,
      undefined,
      dialogPolicy,
    );

    expect(await page.locator('#result').textContent()).toBe('deleted');
    await page.close();
  });

  it('without arming, the default dismiss policy keeps the confirm()-guarded action from proceeding', async () => {
    const executor = new PlaywrightStepExecutor();
    const dialogPolicy = new PlaywrightDialogPolicy();
    const page = await loadFixture(CONFIRM_PAGE);
    dialogPolicy.start(page);

    // When I activate the button "Delete" (no prior accept-dialog step)
    await executor.execute(
      'I activate the button "Delete"',
      match('activate', { role: 'button', name: 'Delete' }),
      locator,
      page,
      undefined,
      dialogPolicy,
    );

    expect(await page.locator('#result').textContent()).toBe('kept');
    await page.close();
  });

  it('arming dismiss explicitly produces the same kept verdict', async () => {
    const executor = new PlaywrightStepExecutor();
    const dialogPolicy = new PlaywrightDialogPolicy();
    const page = await loadFixture(CONFIRM_PAGE);
    dialogPolicy.start(page);

    await executor.execute(
      'I dismiss the dialog',
      match('dismiss-dialog', {}),
      locator,
      page,
      undefined,
      dialogPolicy,
    );
    await executor.execute(
      'I activate the button "Delete"',
      match('activate', { role: 'button', name: 'Delete' }),
      locator,
      page,
      undefined,
      dialogPolicy,
    );

    expect(await page.locator('#result').textContent()).toBe('kept');
    await page.close();
  });

  it('accept-dialog without a supplied DialogPolicy throws a clear StepExecutionError', async () => {
    const executor = new PlaywrightStepExecutor();
    const page = await loadFixture('<p>start</p>');

    const error = await executor
      .execute(
        'I accept the dialog',
        match('accept-dialog', {}),
        locator,
        page,
        // dialogPolicy intentionally omitted
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StepExecutionError);
    expect((error as StepExecutionError).action).toBe('accept-dialog');
    await page.close();
  });
});
