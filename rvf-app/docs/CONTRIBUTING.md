# Contributing to RippleView

Welcome! This guide helps you set up a local development environment from scratch.
Follow every section in order on a clean machine and you will have everything you need
to run, test, and contribute to the **Enterprise Semantic Validation Framework (RippleView)**.

---

## Prerequisites

Install all of the tools in the table below before you clone the repository.

| Tool                     | Minimum version | Purpose                                                          |
| ------------------------ | --------------- | ---------------------------------------------------------------- |
| **Node 20** LTS          | 20.x            | JavaScript runtime for the CLI and build scripts                 |
| **npm**                  | 10.x            | Workspace package manager (ships with Node 20)                   |
| **Docker** Desktop       | 24.x            | Runs the `rv-runner` Linux container for heavy validation work |
| **Git**                  | 2.x             | Version control                                                  |
| **VSCode** (recommended) | latest          | Editor with workspace-recommended extensions                     |

> VSCode is strongly recommended but not strictly required. The preflight script
> will warn (not fail) if it is absent, so headless and CI environments still pass.

---

## Installation

### Node 20 LTS

Use a version manager so you can pin the exact version this repo needs.

**macOS / Linux (nvm)**

```bash
# Install nvm if you don't have it already
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload your shell, then install and activate Node 20
nvm install 20
nvm use 20
```

**macOS (Homebrew)**

```bash
brew install node@20
brew link node@20
```

**Windows (winget)**

```powershell
winget install OpenJS.NodeJS.LTS
```

Verify: `node --version` should print `v20.x.x`.

---

### npm

npm ships with Node 20 — no separate install needed.

Verify: `npm --version` should print `10.x.x`.

---

### Docker Desktop

Download and install Docker Desktop from <https://www.docker.com/products/docker-desktop/>.

| Platform | Notes                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| macOS    | Install the `.dmg`, launch Docker Desktop, and wait for the whale icon to turn steady |
| Windows  | Enable WSL 2 backend in Docker Desktop Settings → General                             |
| Linux    | Install Docker Engine; see <https://docs.docker.com/engine/install/>                  |

Verify: `docker --version` should print `Docker version 24.x.x` (or later).

---

### Git

**macOS**

```bash
# Git ships with Xcode Command Line Tools
xcode-select --install
# — or via Homebrew —
brew install git
```

**Windows**

Download Git for Windows from <https://git-scm.com/download/win> and follow the installer.

**Linux (Debian / Ubuntu)**

```bash
sudo apt update && sudo apt install git
```

Verify: `git --version` should print `git version 2.x.x`.

---

### VSCode

Download from <https://code.visualstudio.com/>.

After opening the repository, accept the **Install Recommended Extensions** prompt.
The workspace recommends the extensions listed in `.vscode/extensions.json`.

---

## Clone and bootstrap

```bash
git clone <repo-url> rv
cd rv

# Install all workspace dependencies
npm install
```

---

## Verify your setup

Run the preflight checker to confirm every required tool is present and meets the
minimum version:

```bash
node scripts/preflight.mjs
```

A fully passing run looks like this:

```
RippleView Developer Environment Preflight
--------------------------------------
Tool    Status   Version
--------------------------------------
node ✓ PASS   v20.12.0
npm ✓ PASS   10.8.2
docker ✓ PASS   Docker version 26.1.0, ...
git ✓ PASS   git version 2.44.0
code ✓ PASS   1.89.0

All required tools are present.
```

If any hard-required tool shows `✗ FAIL`, revisit the installation steps above.
`⚠ WARN` on `code` (VSCode) is expected in headless environments.

---

## Running tests

```bash
npm test
```

Tests use **Vitest**. All unit tests live next to the source they cover (e.g.
`scripts/preflight.test.mjs`). See the [Testing standards]()
for the full quality-gate policy.

---

## Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
feat(core): short description
fix(cli): short description
chore: short description
```

Branch names follow `feat/<scope>-<short-description>`.

---

## Further reading

| Resource                             | Link                                                           |
| ------------------------------------ | -------------------------------------------------------------- |
| RippleView design docs                     | < |
| Repository & Module Layout           | < |
| Testing, Determinism & Quality Gates | < |
| Golden Rules                         | < |
| Agile Roadmap                        | < |
