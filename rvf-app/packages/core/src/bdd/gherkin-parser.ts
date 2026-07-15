import type { BddTag, BddStep, BddScenario, BddFeature } from './types.js';
import { ParseError } from './ParseError.js';
import { parseTags, parseDataTable, parseStepKeyword } from './gherkin-helpers.js';

/**
 * Parse a Gherkin .feature source string into a BddFeature.
 * Throws ParseError (PARSE_GHERKIN_ERROR) on malformed input.
 */
export function parseFeature(source: string, file?: string): BddFeature {
  const lines = source.split('\n');

  let featureName: string | null = null;
  const featureTags: BddTag[] = [];
  const scenarios: BddScenario[] = [];

  let pendingTags: BddTag[] = [];
  let currentScenario: { name: string; tags: BddTag[]; steps: BddStep[] } | null = null;

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] ?? '';
    const line = raw.trim();
    const lineNum = i + 1;

    if (line === '' || line.startsWith('#')) {
      i++;
      continue;
    }

    if (line.startsWith('@')) {
      pendingTags.push(...parseTags(line));
      i++;
      continue;
    }

    if (line.startsWith('Feature:')) {
      featureName = line.slice('Feature:'.length).trim();
      featureTags.push(...pendingTags);
      pendingTags = [];
      i++;
      continue;
    }

    if (featureName === null) {
      throw new ParseError({
        code: 'PARSE_GHERKIN_ERROR',
        message: `Expected "Feature:" declaration but got "${line}"`,
        line: lineNum,
        ...(file !== undefined ? { file } : {}),
      });
    }

    if (line.startsWith('Scenario:')) {
      if (currentScenario !== null) {
        scenarios.push({
          name: currentScenario.name,
          tags: currentScenario.tags,
          steps: currentScenario.steps,
        });
      }
      const scenarioName = line.slice('Scenario:'.length).trim();
      currentScenario = {
        name: scenarioName,
        tags: [...featureTags, ...pendingTags],
        steps: [],
      };
      pendingTags = [];
      i++;
      continue;
    }

    const kw = parseStepKeyword(line);
    if (kw !== null) {
      if (currentScenario === null) {
        throw new ParseError({
          code: 'PARSE_GHERKIN_ERROR',
          message: `Step "${line}" found outside of a Scenario block`,
          line: lineNum,
          ...(file !== undefined ? { file } : {}),
        });
      }

      const text = line.slice(kw.length).trim();
      let dataTable: BddStep['dataTable'];

      if ((lines[i + 1]?.trim() ?? '').startsWith('|')) {
        const { table, consumed } = parseDataTable(lines, i + 1);
        if (consumed > 0) {
          dataTable = table;
          i += consumed;
        }
      }

      currentScenario.steps.push({
        keyword: kw,
        text,
        ...(dataTable !== undefined ? { dataTable } : {}),
      });
      i++;
      continue;
    }

    i++;
  }

  if (currentScenario !== null) {
    scenarios.push({
      name: currentScenario.name,
      tags: currentScenario.tags,
      steps: currentScenario.steps,
    });
  }

  if (featureName === null) {
    throw new ParseError({
      code: 'PARSE_GHERKIN_ERROR',
      message: 'No "Feature:" declaration found in source',
      line: 1,
      ...(file !== undefined ? { file } : {}),
    });
  }

  return { name: featureName, tags: featureTags, scenarios };
}
