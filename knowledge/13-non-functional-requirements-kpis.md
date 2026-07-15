# Non-Functional Requirements & KPIs

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Non-Functional Requirements & KPIs** within the RippleView framework. Part of the **RippleView** documentation set.

## 14. Non-Functional Requirements (from SRS)

- **Determinism (NFR-ENV):** in the PoC, all gate runs inside the official Playwright Docker image — Docker is the PoC determinism mechanism; inject the layout-stabilization CSS (freeze animations/transitions/caret) before any check. (The production deployment target is AWS S3 static hosting, §17.)

- **Performance (NFR-PERF):** sequential 4-layer validation with early-exit; minimal host↔browser payloads.

- **Security (NFR-SEC):** credentials/endpoints injected at runtime via pipeline variables; never in the repo or in YAML/feature files.

- **Maintainability (NFR-MNT):** onboarding a new target requires only config + tests in `RippleViewTests` — zero framework code changes.

---

## 7. Success metrics (KPIs)

- **Regression escape rate** for library/theme upgrades → trending to ~0.

- **XPath/selector maintenance hours** → eliminated (zero-XPath).

- **Mean time to upgrade-confidence** for a candidate across consumers.

- **Coverage %** (visual + functional) per app/library, ratcheting up.

- **Flake rate** < 1%; **gate runtime** within tiered SLAs.

- **Adoption:** # apps/libraries onboarded; # teams self-serving.

---
