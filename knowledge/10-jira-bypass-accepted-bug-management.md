# Issue-Tracker Bypass & Accepted-Bug Management

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Issue-Tracker Bypass & Accepted-Bug Management** within the RippleView framework. Part of the **RippleView** documentation set.

## 11. Issue-Tracker Bypass — Threshold + Distinct-Issue Fingerprinting

Stable issue identity:

```text
issueSignature = SHA-256(target + testId + failureLayer + normalizedDiffSignature)
```

- Failure signature **matches an accepted issue** ⇒ bypass, status `accepted`.

- Failure signature is **new** (different breakage on a later upgrade) ⇒ real fail, prompt a *new* issue. (Detects "same or different issue" automatically.)

- **Threshold gate (default 5, configurable)** = count of active `acceptedBugs` per target:

- `count ≥ threshold − 1` ⇒ **amber** flag.

- `count ≥ threshold` ⇒ **red** flag, **bypass disabled** — gate fails until the app burns down its debt.

- Resolving an issue (fix ships in a version) auto-expires its acceptance and lowers the count.

This converts unlimited issue-bypassing into a bounded, visible **tech-debt budget**.

---
