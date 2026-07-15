# How RippleView Works — A Plain-English Guide

This page explains **what RippleView does and how the pieces fit together**, without any code. If you're not a developer — a QA lead, a product owner, a library maintainer, a manager — this is for you. (For the technical reference, see [`AGENTS.md`](../AGENTS.md) and the design docs it links to.)

---

## 1. The problem, in one sentence

A company has **one shared library** (say, a set of UI components — buttons, dropdowns, data grids) and **many apps** that all use it. When the library team ships a new version, how do they know — _before_ anyone clicks "publish" — that the new version doesn't silently break any of those apps?

Today that usually means: publish, wait for someone to notice something looks wrong, then scramble. RippleView's job is to **catch that before publishing**, automatically, every time.

---

## 2. The two people who use RippleView

RippleView serves two different audiences, asking two different questions:

| Who                                                                             | Their question                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **An app team** (e.g. the team that owns the checkout page)                     | "If I run my app's tests right now, does it work correctly?"                                            |
| **A library maintainer** (e.g. the team that owns the shared component library) | "I'm about to release version 18.4.0 of our library — is it safe to publish, or will it break someone?" |

Both questions are answered by the _same engine_ underneath. The library maintainer's question is really just "run this check against every app that uses my library, and only let me publish if they all still pass."

---

## 3. What a "test run" actually checks

RippleView doesn't take a screenshot and eyeball it. For each app, it:

1. Builds the app for real — the same production build a user would actually get, never a quick developer preview.
2. Walks through the app's important screens and interactions (forms, dropdowns, buttons — anything a real person would touch), using the same accessibility information screen readers use, not brittle pixel coordinates.
3. Compares what it sees today against an approved "last known good" baseline, using several signals at once: did the layout move, did the visual appearance change, did colors/spacing change, did a value actually go wrong — not just "some pixels are different."
4. Produces a clear verdict: **pass** or **fail**, plus the specific list of things that changed and how confident it is about each one. It never quietly rounds a shaky result up to "looks fine" just to turn the light green.

If the app simply fails to build with the new library version at all (a hard incompatibility), that itself is reported as a finding — not a crash, not a silent skip.

---

## 4. Two ways to run it: Local vs. Repo-Bundle

This is the part that's easy to mix up, so here it is side by side.

### A. The Local way — "run it on my own machine, right now"

This is the fast, hands-on mode for a developer or QA person actively working on one app.

- You have the app's code already checked out on your own laptop.
- You point RippleView straight at that folder and say "test this."
- RippleView runs the same checks described above, directly against your local copy, and shows you the result immediately.
- Nothing is uploaded anywhere. There's no packaging step, no waiting in a queue. It's the equivalent of running your app's test suite on your own computer.

**Use this when:** you're actively developing, debugging a failure, or want instant feedback before you even commit your change.

### B. The Repo-Bundle way — "let the framework test it for me, safely, without my source code or my logins"

This is the mode used in a real pipeline — when a library is about to publish a new version and needs to check it against _every_ app that depends on it, possibly dozens of apps the library team has never even seen the source code for.

Here's the key design decision, explained without jargon:

> RippleView **never asks for the keys to your repository.** It never logs into GitHub/Bitbucket on your behalf, and it never asks you to hand over a login token. Instead, **you package up your own app's code yourself** (your own pipeline already has access to it) and **hand RippleView the package** — like mailing a sealed parcel instead of giving someone a spare key to your house.

The steps:

1. Your app's own CI pipeline (the same one you already use to build/deploy) runs a single command that **zips up your app's code** — minus things that should never leave your machine, like `node_modules`, `.git` history, and any secret files (`.env`, API keys, certificates). Those are stripped out automatically before the zip is even created.
2. That zip gets a unique fingerprint (a checksum) so everyone can verify it's exactly the file that was submitted — nothing was tampered with in transit.
3. Your pipeline **pushes** that zip to RippleView's storage. RippleView never reaches out and pulls it — it only ever receives what you choose to send.
4. When it's time to test, RippleView takes the most recently submitted zip for your app, unpacks it into a brand-new, disposable, throwaway workspace, and runs the exact same build-and-test process described in Section 3.
5. Once the test finishes, that throwaway workspace is destroyed. Nothing about your source code persists beyond the result of the test.
6. The result (pass/fail + the list of findings) is recorded and made available — to your team, and to the library team if this was a fan-out check.

**Today (proof-of-concept stage):** that "package storage" is just a local folder on disk — completely offline, no external service, no network dependency at all. **Later, in production:** the exact same zip can instead be pushed to a standard artifact registry (the same kind of registry companies already use to store Docker images or npm packages) — nothing about _how you submit your code_ changes. Swapping from "local folder" to "real registry" is a one-line configuration change, not a rewrite.

**Use this when:** you're wiring up a real CI pipeline, or when a library publisher needs to test against many apps they don't have direct access to.

---

## 5. How a library maintainer decides "can I publish this?"

This is the fan-out scenario — the one that protects everyone downstream of a shared library.

1. The library team finishes a candidate version (say `18.4.0`) but doesn't publish it as the "real," consumable version yet. Instead they publish it under a quiet, provisional label (think of it as a "beta" sticker, not the public one).
2. RippleView asks: "which apps actually depend on this library?" and gets the list.
3. For **each** of those apps, RippleView fetches that app's most recently submitted package (Section 4B), temporarily swaps in the new candidate library version, builds the app for real, and runs the full regression check from Section 3.
4. RippleView collects every app's result into one combined verdict.
5. **Only if every app passes** (within whatever policy the company has agreed on) does RippleView give the green light to **promote** the candidate version — i.e., flip it from "quiet beta" to "the real, public version everyone will get." If even one app fails, the public release is blocked.
6. The library team's own pipeline simply asks RippleView for that verdict and waits — it can either check back periodically or get a notification the moment it's done. Either way, the _answer comes back as a plain pass/fail signal_ that any pipeline, anywhere, already knows how to react to (the same way a pipeline already reacts to "did the build succeed").

### And if it fails — what happens next?

A red result is never a dead end. RippleView hands back exactly **which app(s) broke and what specifically went wrong** (a clear list of findings, not a vague "something's wrong"). From there, a human reviews the result on a dashboard and chooses one of:

- **Fix it** — the library or app team makes a code change and the check simply re-runs.
- **File or link a ticket** — turn the finding into a tracked issue in your tracker so it's not lost, and come back to it.
- **Waive it** — if a human with the right authority decides this particular finding is a false alarm or an accepted risk, they can explicitly override it. That override is always recorded — who approved it and when — so there's a clear audit trail, never a silent bypass.

The publish stays blocked until one of those happens and the check goes green. Nothing publishes on a guess.

---

## 6. Putting it all together — the full picture

```
                 ┌─────────────────────────┐
   App team's │  1. App's own CI zips │
   own pipeline │  its own code (secrets │
                 │  stripped) and submits │──┐
                 └─────────────────────────┘ │
                                                ▼
                                  ┌───────────────────────┐
                                  │   RippleView's package │   (today: local folder
                                  │   storage │    tomorrow: a registry —
                                  └───────────────────────┘    no change to step 1)
                                                │
                Library team ┌───────┴────────┐
                publishes a ───────▶│  RippleView fetches │
                "beta" version │  each app's │
                                       │  latest package, │
                                       │  builds it with │
                                       │  the beta version, │
                                       │  runs regression │
                                       │  checks │
                                       └───────┬────────┘
                                                │
                                  ┌─────────────┴──────────────┐
                                  │ │
                              ALL PASS                     ANY FAIL
                                  │ │
                                  ▼ ▼
                    Library version is safe to        Publish stays blocked.
                    promote/publish for real.          Dashboard shows exactly what
                                                        broke → fix, ticket, or
                                                        human-approved waiver →
                                                        re-run.
```

---

## 7. Quick answers to common questions

**Does RippleView ever see my GitHub/Bitbucket login or my private keys?**
No. RippleView never has SCM credentials for any app, ever. It only ever receives a package that your own pipeline chose to send it.

**What if my app is Angular, and another app is React, and a third uses Webpack Module Federation?**
Doesn't matter. RippleView doesn't assume one framework or one Node.js version — each app declares its own build instructions (what command builds it, what Node version it needs), and RippleView simply follows them, framework-agnostic.

**Is my code stored forever once I submit it?**
A submitted package sits in storage only long enough to be the "current" version for testing — every new submission simply replaces the previous one as "latest." The actual build/test happens in a disposable workspace that's thrown away right after the run.

**What if a test result looks wrong?**
Every result is backed by a recorded report — what was checked, what changed, how confident the system was — so a human can always inspect _why_ a verdict came out the way it did, rather than just trusting a black box.

**Can someone just hack the test to always say "pass"?**
No automated process is allowed to quietly force a pass, and no AI assistant is ever allowed to make the actual pass/fail decision inside this pipeline — that decision is always made by the deterministic checks themselves, with a human in the loop for anything ambiguous.

**Do I have to use the "repo-bundle" way, or can I just always test locally?**
Local testing is great for your own day-to-day development. But the bundle way is what makes the _library-wide safety net_ possible — it's how one library team can safely check "will this break any of the 40 apps that use us?" without ever touching those 40 teams' source control.
