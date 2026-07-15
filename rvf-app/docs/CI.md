# CI Setup — Jenkins

This guide walks through wiring Jenkins to the RippleView monorepo so that every pull
request is gated on lint, typecheck, unit tests, and a build. It covers both a
**local Jenkins instance** (Docker Compose, for smoke-testing the pipeline) and a
**remote Jenkins server** (for real PR gating).

---

## Prerequisites

| Tool                                    | Purpose                                                           |
| --------------------------------------- | ----------------------------------------------------------------- |
| Docker Desktop 24+                      | Runs the local Jenkins stack and the `node:20-alpine` build agent |
| Git 2.x                                 | Source control                                                    |
| A GitHub account with repo admin rights | Webhook + branch protection configuration                         |

---

## 1. Start local Jenkins (Docker Compose)

A self-contained Jenkins stack is defined in `docker-compose.jenkins.yml` at the
repo root. It mounts the host Docker socket so the declarative pipeline's Docker
agent can pull and run containers without Docker-in-Docker complexity.

```bash
# Start Jenkins in the background
docker compose -f docker-compose.jenkins.yml up -d

# Jenkins is now available at http://localhost:8080
```

Retrieve the one-time admin password printed during first boot:

```bash
docker exec jenkins-jenkins-1 cat /var/jenkins_home/secrets/initialAdminPassword
```

Paste it into the browser setup wizard and choose **Install suggested plugins**.

---

## 2. Install required plugins

After the initial setup, go to **Manage Jenkins → Plugins → Available plugins** and
install (or verify) the following:

| Plugin                   | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| **Docker Pipeline**      | Lets the `agent { docker { … } }` block work    |
| **GitHub**               | Posts commit status back to GitHub PRs          |
| **GitHub Branch Source** | Discovers PRs from GitHub and runs the pipeline |

Restart Jenkins after installing if prompted.

---

## 3. Add GitHub credentials

Jenkins needs a GitHub Personal Access Token (PAT) to clone the repo and post
status checks.

1. In GitHub: **Settings → Developer settings → Personal access tokens → Tokens (classic)** → Generate new token.
   Required scopes: `repo`, `admin:repo_hook`.
2. In Jenkins: **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**.
   - Kind: **Secret text**
   - Secret: your PAT
   - ID: `github-pat` (referenced in Jenkinsfile if needed for private repos)

> Secrets are stored in the Jenkins Credentials Store and never committed to the
> repository (Golden Rule G18).

---

## 4. Create a Pipeline job

1. **New Item** → enter a name (e.g. `rv`) → select **Pipeline** → OK.
2. Under **General**, check **GitHub project** and enter the repo URL.
3. Under **Build Triggers**, check **GitHub hook trigger for GITScm polling**.
4. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/<org>/rv.git`
   - Credentials: select `github-pat` (for private repos)
   - Branch: `*/main` (or `**` to build all branches)
   - Script Path: `Jenkinsfile`
5. Click **Save**.

---

## 5. Configure the GitHub webhook

Jenkins receives push and pull-request events via a webhook.

1. In the GitHub repository: **Settings → Webhooks → Add webhook**.
2. Fill in:
   - **Payload URL**: `http://<jenkins-host>:8080/github-webhook/`
     (replace `<jenkins-host>` with your server's IP or DNS name; for local
     testing use [ngrok](https://ngrok.com/) to expose `localhost:8080`)
   - **Content type**: `application/json`
   - **Which events**: select **Let me select individual events** → check
     **Pushes** and **Pull requests**
3. Click **Add webhook**. GitHub will send a ping event; a green tick confirms
   Jenkins received it.

---

## 6. Enable PR status reporting

The `jenkinsci/github-plugin` automatically posts a commit status check to every
commit it builds. The status context it uses is:

```
continuous-integration/jenkins/pr-merge
```

No extra configuration is needed beyond installing the **GitHub** plugin and
providing credentials in step 3.

---

## 7. Configure branch protection (AC2 — block failing PRs)

Branch protection ensures no PR can be merged while the Jenkins status check is
failing.

1. In GitHub: **Settings → Branches → Add branch protection rule**.
2. Branch name pattern: `main`.
3. Check **Require status checks to pass before merging**.
4. In the search box, type `continuous-integration/jenkins` and select the
   matching status check that appears after the first pipeline run.
5. Optionally check **Require branches to be up to date before merging**.
6. Click **Save changes**.

From this point on, a failing Jenkins check blocks the PR merge button.

---

## 8. Verify end-to-end

1. Open a feature branch and push a commit.
2. Open a pull request against `main`.
3. Jenkins should trigger within seconds (webhook) and run all five stages:
   **Install → Lint → Typecheck → Test → Build**.
4. On success, GitHub shows a green status check on the PR.
5. On failure, GitHub shows a red status check and the merge button is disabled.

---

## Troubleshooting

| Symptom                                                | Likely cause                                       | Fix                                                                 |
| ------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| Webhook ping fails (red X in GitHub)                   | Firewall / NAT blocks inbound traffic to port 8080 | Use ngrok for local testing; open the port on a remote server       |
| `docker: command not found` inside pipeline            | Docker socket not mounted                          | Verify `docker-compose.jenkins.yml` mounts `/var/run/docker.sock`   |
| `npm: command not found`                              | Install stage failed or PATH not set               | Check the Node/npm setup in the Jenkinsfile |
| Status check never appears in branch protection search | Pipeline has not run yet                           | Trigger at least one build so the context is registered with GitHub |

---

## rv-runner Docker image

### What it is and why

The `rv-runner` image is a **deterministic validation runner** that bundles the
`@rippleview/cli` tool inside the pinned Playwright environment (Ubuntu Noble). All heavy
validation work runs inside this Linux container (Golden Rule G8), ensuring identical
results on Mac, Windows, and Linux CI agents.

The image is built from `docker/rv-runner/Dockerfile` and is the only runtime
artefact required to execute RippleView validation jobs in CI.

### Playwright base image

The image is based on:

```
mcr.microsoft.com/playwright:v1.49.0-noble
```

This tag is pinned to a specific Playwright version — never `:latest` — to satisfy
the determinism requirement (Golden Rule G13). When the project upgrades Playwright,
update this tag explicitly and review the changelog.

### Build the image locally

From the repository root:

```bash
docker build -t rv-runner:local -f docker/rv-runner/Dockerfile.
```

### Run the image

Mount a local directory as `/data` to pass in a config file and receive results:

```bash
docker run --rm \
  -v $(pwd)/data:/data \
  rv-runner run \
  --config /data/rippleview.config.yaml \
  --output /data/results
```

The `WORKDIR /data` instruction means relative paths inside the container resolve
to the mounted volume, satisfying AC-2 (results written to the mounted volume).

### CI build stage

The **Build Runner Image** stage in `Jenkinsfile` builds and tags the image on every
successful `main` build:

```groovy
stage('Build Runner Image') {
    when {
        branch 'main'
    }
    steps {
        sh """
            docker build \\
                -t rv-runner:\${BUILD_NUMBER} \\
                -t rv-runner:latest \\
                -f docker/rv-runner/Dockerfile \\
                .
        """
    }
}
```

The `when { branch 'main' }` guard keeps feature-branch and PR pipelines fast by
skipping the image build. The image is tagged with both the Jenkins build number
(for traceability) and `latest` (for convenience).

> Registry credentials (if publishing to a remote registry) must be stored in the
> Jenkins Credentials Store and injected via `withCredentials` — never committed
> to the repository (Golden Rule G18).
