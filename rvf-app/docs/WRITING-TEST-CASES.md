# Writing Test Cases — A Plain-English Guide

This page is for anyone **writing** RippleView test scenarios — a QA engineer, a test author, a developer adding coverage for a new component. It explains, without code, what English sentences RippleView understands, how a sentence turns into a real action in a real browser, and the steps to put together a working test case. (For the bigger picture of why RippleView exists at all, see [`HOW-IT-WORKS.md`](HOW-IT-WORKS.md). For the engineering reference, see [`AGENTS.md`](../AGENTS.md).)

---

## 1. The big idea

RippleView test cases are written as plain Gherkin sentences — the same `Given` / `When` / `Then` style used by Cucumber and similar tools. You don't write any browser-automation code. You write a sentence like:

> When I activate the button "Save"

RippleView reads that sentence, recognizes the shape of it ("I activate the **button** "**Save**""), and turns it into a real click on the real Save button in a real browser. If the sentence doesn't match anything RippleView understands, you get a clear "no step matches this text" error — never a silent no-op.

Every sentence goes through the same three-stage pipeline:

1. **Match** — RippleView compares your sentence against its catalog of known step phrasings (the full list is in Section 3) and figures out which action you mean, plus any details in quotes (the button's name, the text you typed, etc.).
2. **Find** — RippleView locates the actual element on the page. Critically, it does this the same way a screen reader would: by the element's **role** (button, checkbox, textbox, region…) and its **accessible name** (the visible label, not a hidden internal ID). This is deliberate — see Section 4.
3. **Act** — RippleView performs the real action (click, type, hover, check a value…) against that element in a real browser, and reports back a clear pass or a clear failure with the exact reason.

If anything goes wrong at any stage, the error you get back always names the **exact step text** that failed and, for assertions, exactly what RippleView expected versus what it actually found — never a vague "test failed."

---

## 2. Before you write a step: name your elements properly

RippleView finds elements by **role + accessible name** — the same information a screen reader announces. Concretely, this means:

- A button needs a visible label or an `aria-label` — that visible text (or label) _is_ its name. "the button \"Save\"" only works if a real button on the page is actually named "Save".
- A text field needs a **properly associated** `<label>` — either wrapping the input, or using `for`/`id`, or `aria-label`/`aria-labelledby`. A `<label>` that's just sitting next to an `<input>` with no programmatic link doesn't count — RippleView (correctly) won't find it, the same way a screen reader wouldn't announce it as that field's name.
- Regions (panels, sections, dialogs) need an accessible name too — usually via a heading the region points to with `aria-labelledby`, or an `aria-label` directly on the region.

**Why this matters:** RippleView never targets elements by CSS class, XPath, or hidden test IDs as a first resort. That's a deliberate design choice — those are invisible to a real user and break the moment a developer reorganizes markup. Role + name is the one targeting strategy that's both resilient to refactors _and_ doubles as a free accessibility check: if RippleView can't find your button by name, neither can a screen reader user.

If a step can't find its element, fix the markup's accessibility (add the missing label/`aria-label`/`aria-labelledby`), not the test.

---

## 3. The full step catalog

Every sentence below is a _pattern_ — the parts in quotes are whatever real text applies to your app. Mix and match these to build a scenario.

### Navigation — getting to the right place

| Say this                      | What it does                                                                                                                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `I am on route "/billing"`    | Navigates to that page/route.                                                                                                                                                                                                                            |
| `within the "Billing" region` | Scopes every following step to only look inside the named region — use this to disambiguate two elements with the same name in different parts of the page (e.g. two "City" fields, one in a "Billing" section and one in a "Customer Profile" section). |
| `a button is mounted`         | Asserts that at least one element of that role exists on the page right now (swap "button" for any role — "a dialog is mounted", "a checkbox is mounted").                                                                                               |

### Setting up data

| Say this                      | What it does                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `a grid with at least 5 rows` | Ensures the backing data has at least that many rows before the scenario runs. |
| `seeded data users`           | Loads a named, pre-defined reference dataset before the scenario runs.         |

### Actions — doing things

| Say this                                    | What it does                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `I activate the button "Save"`              | Clicks it. ("Activate" works for any clickable role — buttons, links, etc.)                            |
| `I type "Paris" into the field "City"`      | Types text into a labeled field, replacing whatever was there.                                         |
| `I select "Gold" from "Tier"`               | Picks an option from a dropdown — works for a plain HTML dropdown or a custom combobox-style dropdown. |
| `I toggle the switch "Notifications"`       | Clicks a toggle/switch control.                                                                        |
| `I expand "Advanced options"`               | Clicks a collapse/expand trigger.                                                                      |
| `I hover the button "Help"`                 | Hovers the mouse over it (useful for triggering tooltips).                                             |
| `I focus the button "Search"`               | Moves keyboard focus to it.                                                                            |
| `I press "Enter"`                           | Presses a key on the keyboard (whatever currently has focus receives it).                              |
| `I double-click the button "Row 3"`         | Double-clicks it.                                                                                      |
| `I right-click the button "Row 3"`          | Right-clicks it (opens a context menu, etc.).                                                          |
| `I scroll to the button "Submit"`           | Scrolls the page until it's in view.                                                                   |
| `I scroll down by 300 pixels`               | Scrolls the page by a fixed amount (`up` or `down`).                                                   |
| `I clear the field "Search"`                | Empties a text field.                                                                                  |
| `I drag the button "Item A" to "Drop Zone"` | Drags one element onto another.                                                                        |
| `I check the checkbox "Agree to terms"`     | Checks a checkbox.                                                                                     |
| `I uncheck the checkbox "Agree to terms"`   | Unchecks a checkbox.                                                                                   |

### Assertions — checking things are correct

| Say this                                                          | What it does                                                                                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `the button "Save" is visible`                                    | Passes only if it's actually visible on screen right now.                                                                              |
| `the 2nd button "Remove" is visible`                              | Same, but when there are several matching elements, picks a specific one by position (1st, 2nd, 3rd…) instead of failing on ambiguity. |
| `the button "Save" is enabled`                                    | Passes only if it's interactive (not disabled).                                                                                        |
| `the button "Save" is disabled`                                   | Passes only if it's disabled.                                                                                                          |
| `the text "Welcome back" is shown`                                | Passes if that exact visible text appears anywhere on the page.                                                                        |
| `the selection equals "Gold"`                                     | Passes if the currently-selected option (in a dropdown/list) matches.                                                                  |
| `the button count equals 3`                                       | Passes if exactly that many elements of that role exist (any role, not just buttons).                                                  |
| `"Save" does not overlap "Cancel"`                                | Passes if the two named elements' on-screen positions don't visually collide — useful for catching layout regressions.                 |
| `the "Logo" is within the viewport`                               | Passes if it's actually inside the visible screen area, not scrolled off.                                                              |
| `the attribute "aria-expanded" of button "Filters" equals "true"` | Passes if a specific HTML attribute has the exact expected value.                                                                      |
| `the URL is "/billing/confirm"`                                   | Passes if the current page address matches.                                                                                            |

Every assertion above, when it fails, reports exactly what it expected and what it actually found — e.g. "expected `true` but got `false`" — so you never have to guess why a test went red.

---

## 4. Steps to write a test case

1. **Pick the user journey.** Write it first as a plain English sentence — "a user opens the billing page, removes a line item, and the total updates" — before worrying about RippleView syntax at all.
2. **Break it into Given/When/Then steps**, one action or check per line, using the catalog in Section 3 as your vocabulary. Reuse the exact phrasings — they're not just examples, they're the only sentences RippleView currently recognizes.
3. **Use real, visible names** for every role+name pair — the actual label text a user would see, not an internal ID. If you're not sure what name an element has, check what a screen reader would announce (its accessible name), not its CSS class.
4. **Disambiguate when needed.** If two elements share a name (three "Remove" buttons, two "City" fields in different sections), either scope with `within the "..." region` first, or use the ordinal form (`the 2nd button "Remove"`) where the catalog supports it.
5. **End every scenario with at least one assertion.** A scenario that only performs actions and never checks anything can "pass" without proving anything actually worked.
6. **Run it and read the failure message if it's red.** Because every failure carries the exact step text plus actual-vs-expected, you can usually tell what's wrong without re-running anything — either the test's expectation was wrong, or the app genuinely regressed.

### Example scenario

```
Given I am on route "/billing"
And within the "Billing" region
When I type "Paris" into the field "City"
And I activate the button "Save"
Then the text "Saved" is shown
And the button "Save" is enabled
```

---

## 5. What's not covered yet

- **Region-scoping** (`within the "..." region`) and **data setup** (`a grid with...`, `seeded data...`) are recognized today, but the engine that actually wires them into a running scenario end-to-end is still being built. The step phrasings above are the stable, final vocabulary — write your scenarios using them now; they'll just work once that wiring lands.
- If a step can't find its element and you've confirmed the markup _does_ have a real, programmatically-associated accessible name, that's a real finding worth reporting — not something to work around by adding a test-only attribute.

---

For how a sentence is technically matched and executed, see the `@rippleview/core` and `@rippleview/plugin-playwright` package READMEs.
