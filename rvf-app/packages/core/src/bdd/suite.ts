import { readFile } from 'node:fs/promises';
import type { BddFeature, ScenarioBinding, ParsedScenario, ParsedSuite } from './types.js';
import { ParseError } from './ParseError.js';
import { parseFeature } from './gherkin-parser.js';
import { parseYamlBinding } from './yaml-parser.js';

/**
 * Combine a parsed feature with an optional YAML binding into a ParsedSuite.
 * Binding entries are matched to scenarios by exact scenario name.
 */
export function parseSuite(featureSource: string, yamlSource?: string, file?: string): ParsedSuite {
  const feature = parseFeature(featureSource, file);
  const binding = yamlSource !== undefined ? parseYamlBinding(yamlSource, file) : undefined;

  const bindingMap = new Map<string, ScenarioBinding>(
    (binding?.bindings ?? []).map((b) => [b.scenario, b]),
  );

  const scenarios: ParsedScenario[] = feature.scenarios.map((scenario) => {
    const matchedBinding = bindingMap.get(scenario.name);
    return {
      scenario,
      ...(matchedBinding !== undefined ? { binding: matchedBinding } : {}),
    };
  });

  return { feature, scenarios };
}

/** Read and parse a .feature file from disk. */
export async function parseFeatureFile(featurePath: string): Promise<BddFeature> {
  let source: string;

  try {
    source = await readFile(featurePath, 'utf8');
  } catch (err) {
    throw new ParseError({
      code: 'PARSE_GHERKIN_ERROR',
      message: `Cannot read feature file: ${featurePath}`,
      file: featurePath,
      cause: err,
    });
  }

  return parseFeature(source, featurePath);
}

/** Read and parse a .feature + optional .yaml pair from disk. */
export async function parseSuiteFiles(
  featurePath: string,
  yamlPath?: string,
): Promise<ParsedSuite> {
  const [featureSource, yamlSource] = await Promise.all([
    readFile(featurePath, 'utf8').catch((err) => {
      throw new ParseError({
        code: 'PARSE_GHERKIN_ERROR',
        message: `Cannot read feature file: ${featurePath}`,
        file: featurePath,
        cause: err,
      });
    }),
    yamlPath !== undefined
      ? readFile(yamlPath, 'utf8').catch((err) => {
          throw new ParseError({
            code: 'PARSE_YAML_ERROR',
            message: `Cannot read YAML binding file: ${yamlPath}`,
            file: yamlPath,
            cause: err,
          });
        })
      : Promise.resolve(undefined),
  ]);

  return parseSuite(featureSource, yamlSource, featurePath);
}
