<!--
RippleView PR template. Applies to all contributors, human and AI.
AI-generated PRs MUST be human-reviewed and approved before merge (Golden Rule G4). AI never self-merges.
-->

## What & why

<!-- One paragraph: what this PR does and why. -->

## Traceability

- **Jira:** \_\_\_\_ <!-- the Jira key this implements, e.g. PROJ-1234 -->
- **Design doc:** <!-- link any design doc from the issue's Reference section -->
- **Standards applied:** <!-- e.g. Code Style, Repo Layout, Plugin SPI, Testing -->

## Acceptance criteria → tests

<!-- List each AC and the test that proves it. -->

- [ ] AC1 — … → `path/to/test`
- [ ] AC2 — … → `path/to/test`

## Golden Rules self-check (tick = compliant / N/A)

- [ ] G1 `@rippleview/core` stays agnostic (no app/framework/vendor imports)
- [ ] G2 A11y-tree locators only (no XPath/CSS/`data-testid`)
- [ ] G3 base-test version derived from component version (lockstep)
- [ ] G4 no AI/LLM call on the gate/CI path; this PR is human-reviewed
- [ ] G5 result/document shapes unchanged (or migration-shape-compatible)
- [ ] G10 build/peer-dep breaks handled as findings, not crashes
- [ ] G13 determinism: time/animation/fonts/network frozen; no fixed sleeps
- [ ] G15 no hardcoded tokens / `::ng-deep` / `!important` / `ViewEncapsulation.None`
- [ ] G16 public-API changes have an api-extractor note + correct semver
- [ ] G18 no secrets committed/logged; PII redacted

## Quality gate

- [ ] `npm run lint` green
- [ ] `npm run typecheck` green
- [ ] `npm test` green
- [ ] No new Layer-0 violations
- [ ] Scope limited to this story (no unrelated refactors)

## Reviewer (human) sign-off

- [ ] Acceptance criteria met and tested
- [ ] Golden Rules honoured
- [ ] Approved for merge

<!-- If this PR was AI-assisted, note which tool/agent (e.g. Claude Code rv-implementer). -->
