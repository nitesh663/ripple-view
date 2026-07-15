import type { BrowserContext } from 'playwright';
import type {
  BddScenario,
  BrowserMatrixEntry,
  EngineFailure,
  EngineResult,
  LocatorStrategy,
  StepResult,
} from '@rippleview/core';
import { StepRegistry } from '@rippleview/core';
import { PlaywrightLocatorStrategy } from '../locator/PlaywrightLocatorStrategy.js';
import { PlaywrightStepExecutor } from '../executor/PlaywrightStepExecutor.js';
import { PlaywrightWaitStrategy } from '../wait/PlaywrightWaitStrategy.js';
import { PlaywrightNetworkCapture } from '../network/PlaywrightNetworkCapture.js';
import { PlaywrightDialogPolicy } from '../dialog/PlaywrightDialogPolicy.js';
import { PlaywrightTabTracker } from '../tabs/PlaywrightTabTracker.js';
import type { PlaywrightEngineContext } from './PlaywrightEngineExecutor.js';
import { toEngineFailure } from './toEngineFailure.js';
import { runStep } from './runStep.js';

/**
 * Steps whose action is an assertion — BDD-04 requires waiting on network
 * idle (and visual settle, via PlaywrightWaitStrategy) before each of
 * these, never before a plain action.
 */
const ASSERTION_ACTIONS = new Set([
  'assert-mounted',
  'assert-visible',
  'assert-enabled',
  'assert-disabled',
  'assert-text',
  'assert-selection',
  'assert-count',
  'assert-no-overlap',
  'assert-in-viewport',
  'assert-attribute',
  'assert-url',
  'assert-api-called',
  'assert-api-status',
  'assert-api-body-contains',
]);

/**
 * Walks one BddScenario's steps against a fresh page in `context` (
 * AC1). Split out of PlaywrightEngineExecutor.ts (SOLID + 200-line limit) —
 * that file owns only the browser/context lifecycle; this one owns the
 * actual StepRegistry -> LocatorStrategy/StepExecutor/WaitStrategy walk.
 *
 * `scope-region` is intercepted here, never forwarded to
 * PlaywrightStepExecutor (which deliberately throws on it — see its own
 * doc comment): composing `LocatorStrategy.withScope()` is exactly the
 * "composition concern owned by the scenario runner" that comment
 * describes, and this function IS that runner.
 */
export async function runScenario(
  entry: BrowserMatrixEntry,
  scenario: BddScenario,
  context: BrowserContext,
  engineCtx: PlaywrightEngineContext,
): Promise<EngineResult> {
  const page = await context.newPage();
  const registry = engineCtx.registry ?? new StepRegistry();
  const wait = new PlaywrightWaitStrategy();
  const stepExecutor = new PlaywrightStepExecutor();
  const networkCapture = new PlaywrightNetworkCapture();
  const dialogPolicy = new PlaywrightDialogPolicy();
  const tabTracker = new PlaywrightTabTracker();

  networkCapture.start(page);
  dialogPolicy.start(page);
  tabTracker.start(page);

  let locator: LocatorStrategy = new PlaywrightLocatorStrategy();

  // Per-step + scenario timing/status for detailed reporting (results.json /
  // console table). Reporting only — never gates a verdict (G13: timing is
  // observed, never asserted on).
  const steps: StepResult[] = [];
  const scenarioStart = Date.now();
  const elapsed = (since: number): number => Date.now() - since;

  for (const step of scenario.steps) {
    const stepStart = Date.now();
    const match = registry.match(step.text);
    if (match === null) {
      steps.push({
        stepText: step.text,
        action: 'assert-mounted',
        status: 'fail',
        durationMs: elapsed(stepStart),
      });
      skipRemaining(steps, scenario, step, registry);
      return failure(entry, unmatchedStepFailure(step.text), scenario, scenarioStart, steps);
    }

    if (match.action === 'scope-region') {
      locator = locator.withScope(String(match.params['region'] ?? ''));
      steps.push({
        stepText: step.text,
        action: match.action,
        status: 'pass',
        durationMs: elapsed(stepStart),
      });
      continue;
    }

    if (ASSERTION_ACTIONS.has(match.action)) {
      await wait.waitForNetworkIdle(page);
    }

    const outcome = await runStep({
      stepText: step.text,
      match,
      locator,
      page,
      stepExecutor,
      networkCapture,
      dialogPolicy,
      tabTracker,
    });

    steps.push({
      stepText: step.text,
      action: match.action,
      status: outcome.ok ? 'pass' : 'fail',
      durationMs: elapsed(stepStart),
    });

    if (!outcome.ok) {
      skipRemaining(steps, scenario, step, registry);
      return failure(
        entry,
        toEngineFailure(step.text, match.action, outcome.error),
        scenario,
        scenarioStart,
        steps,
      );
    }
  }

  return {
    browser: entry.browser,
    verdict: 'pass',
    name: scenario.name,
    durationMs: elapsed(scenarioStart),
    steps,
  };
}

/**
 * Records every step after the one that failed as 'skipped' (duration 0) so
 * the reported step list always covers the whole scenario, with the walk
 * stopping at the first failure (AC3).
 */
function skipRemaining(
  steps: StepResult[],
  scenario: BddScenario,
  failedStep: BddScenario['steps'][number],
  registry: StepRegistry,
): void {
  const failedIdx = scenario.steps.indexOf(failedStep);
  for (const remaining of scenario.steps.slice(failedIdx + 1)) {
    steps.push({
      stepText: remaining.text,
      action: registry.match(remaining.text)?.action ?? 'assert-mounted',
      status: 'skipped',
      durationMs: 0,
    });
  }
}

function failure(
  entry: BrowserMatrixEntry,
  engineFailure: EngineFailure,
  scenario: BddScenario,
  scenarioStart: number,
  steps: StepResult[],
): EngineResult {
  return {
    browser: entry.browser,
    verdict: 'fail',
    failure: engineFailure,
    name: scenario.name,
    durationMs: Date.now() - scenarioStart,
    steps,
  };
}

/**
 * `StepRegistry.match()` returning `null` is never silently skipped (AC1) —
 * there is no `StepMatch`/`ActionType` to report here (nothing matched at
 * all), so this builds the `EngineFailure` directly rather than forcing an
 * arbitrary `ActionType` sentinel through `toEngineFailure`.
 */
function unmatchedStepFailure(stepText: string): EngineFailure {
  return {
    stepText,
    action: 'assert-mounted',
    message: `No catalog pattern matched step: "${stepText}"`,
  };
}
