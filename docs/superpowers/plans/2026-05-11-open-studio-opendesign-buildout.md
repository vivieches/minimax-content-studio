# Open Studio OpenDesign Buildout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Open Studio into a local-first content production workspace using OpenDesign's daemon, project, run, agent, media, research, memory, critique and export architecture.

**Architecture:** The web app remains Next.js. A separate local daemon becomes the privileged runtime and owns storage, projects, runs, agents, providers, media tasks, research and exports. Next API routes stay as compatibility proxies while UI migrates to project/run APIs.

**Tech Stack:** Next.js 16 App Router, TypeScript, Node.js daemon, filesystem-backed `.open-studio/` storage, Vitest, Playwright, local agent CLIs, BYOK HTTP providers.

---

## File Structure

Create and evolve these boundaries:

- `daemon/server.ts`: local HTTP server, health, route registration.
- `daemon/cli.ts`: daemon CLI entrypoint and media/research subcommands.
- `daemon/context.ts`: storage paths, daemon URL, config.
- `daemon/routes/*.ts`: HTTP route modules.
- `daemon/projects/*.ts`: project model, safe files, manifest, import/export.
- `daemon/runs/*.ts`: run registry, events, cancellation.
- `daemon/runtimes/*.ts`: agent definitions, capabilities, invocation, parsers.
- `daemon/media/*.ts`: media providers, task store, command contract.
- `daemon/research/*.ts`: Tavily/search contract and reports.
- `daemon/prompts/*.ts`: prompt composer layers.
- `daemon/skills/*.ts`: skills scanner and registry.
- `daemon/memory/*.ts`: memory store and extraction.
- `daemon/critique/*.ts`: package critique scoring and transcript.
- `daemon/export/*.ts`: MD/JSON/HTML/PDF/ZIP writers.
- `lib/daemon-client.ts`: typed client used by Next API routes.
- `app/api/**/route.ts`: compatibility proxies.
- `app/(dashboard)/**`: UI wired to real project/run state.
- `docs/open-studio-opendesign-complete-sdd.md`: canonical SDD.
- `docs/specs/open-studio-opendesign-sprints.md`: sprint breakdown.

## Task 1: Current Stability Gate

**Files:**
- Inspect: `package.json`
- Inspect: `app/(dashboard)/settings/page.tsx`
- Inspect: `app/(dashboard)/pipeline/page.tsx`
- Inspect: `app/(dashboard)/content/page.tsx`
- Inspect: `app/api/generate/image/route.ts`
- Inspect: `app/api/generate/titles/route.ts`

- [ ] **Step 1: Run unit tests**

Run:

```powershell
rtk npm test
```

Expected: all Vitest tests pass. If a test fails, record the failing test name before changing code.

- [ ] **Step 2: Run lint**

Run:

```powershell
rtk npm run lint
```

Expected: ESLint passes and `.agents/skills` is not included in lint scope.

- [ ] **Step 3: Run build**

Run:

```powershell
rtk npm run build
```

Expected: Next build passes.

- [ ] **Step 4: Fix current regressions before daemon work**

If settings defaults are not persisted, add/adjust tests around `lib/storage/settings.ts` and Settings UI handlers so text and image defaults survive navigation and reload.

Expected behavior:

```ts
expect(settings.defaults.text.providerId).toBe("openai");
expect(settings.defaults.image.providerId).toBe("openai");
```

- [ ] **Step 5: Confirm pipeline title persistence**

Add or update API/UI test so a pipeline package with `titleCandidates` can be loaded by `/content`.

Expected behavior:

```ts
expect(packageResult.titleCandidates).toHaveLength(10);
expect(contentPage.latestTitlePack.candidates).toHaveLength(10);
```

## Task 2: Daemon Skeleton

**Files:**
- Create: `daemon/context.ts`
- Create: `daemon/server.ts`
- Create: `daemon/cli.ts`
- Create: `daemon/routes/health.ts`
- Create: `lib/daemon-client.ts`
- Modify: `package.json`
- Modify: `app/api/health/route.ts`
- Test: `daemon/server.test.ts`

- [ ] **Step 1: Write daemon health test**

Create a test that starts the daemon on an ephemeral port and calls `/api/health`.

Expected response:

```json
{
  "ok": true,
  "service": "open-studio-daemon"
}
```

- [ ] **Step 2: Implement daemon context**

Define storage roots:

```ts
export type DaemonContext = {
  rootDir: string;
  storageDir: string;
  projectsDir: string;
  logsDir: string;
  startedAt: string;
};
```

- [ ] **Step 3: Implement daemon server**

Expose `GET /api/health`, `GET /api/status`, and `GET /api/logs`.

- [ ] **Step 4: Add daemon CLI**

Add commands:

```powershell
rtk proxy node daemon/cli.ts serve --port 0
rtk proxy node daemon/cli.ts health --url http://127.0.0.1:<port>
```

- [ ] **Step 5: Add Next daemon client**

`lib/daemon-client.ts` resolves daemon URL from env/settings and falls back to local Next behavior during migration.

- [ ] **Step 6: Verify**

Run:

```powershell
rtk npm test -- daemon/server.test.ts
rtk npm run build
```

## Task 3: Project Store

**Files:**
- Create: `daemon/projects/types.ts`
- Create: `daemon/projects/paths.ts`
- Create: `daemon/projects/store.ts`
- Create: `daemon/routes/projects.ts`
- Test: `daemon/projects/store.test.ts`
- Modify: `lib/storage/assets.ts`
- Modify: `lib/storage/exports.ts`

- [ ] **Step 1: Test safe path validation**

Cases:

```ts
expect(validateProjectPath("files/script.md")).toBe("files/script.md");
expect(() => validateProjectPath("../secret.txt")).toThrow("invalid project path");
expect(() => validateProjectPath("C:\\secret.txt")).toThrow("invalid project path");
```

- [ ] **Step 2: Implement project creation**

Create `project.json`:

```json
{
  "id": "proj_x",
  "name": "Untitled package",
  "status": "draft",
  "createdAt": "iso",
  "updatedAt": "iso"
}
```

- [ ] **Step 3: Implement project files**

Functions:

```ts
createProject(input)
listProjects()
getProject(projectId)
writeProjectFile(projectId, path, bytes)
readProjectFile(projectId, path)
listProjectFiles(projectId)
deleteProjectFile(projectId, path)
```

- [ ] **Step 4: Add routes**

Routes:

```text
GET /api/projects
POST /api/projects
GET /api/projects/:projectId
PATCH /api/projects/:projectId
DELETE /api/projects/:projectId
GET /api/projects/:projectId/files
PUT /api/projects/:projectId/files/:path
```

- [ ] **Step 5: Verify**

Run:

```powershell
rtk npm test -- daemon/projects/store.test.ts
```

## Task 4: Run Lifecycle

**Files:**
- Create: `daemon/runs/types.ts`
- Create: `daemon/runs/store.ts`
- Create: `daemon/runs/events.ts`
- Create: `daemon/routes/runs.ts`
- Test: `daemon/runs/store.test.ts`

- [ ] **Step 1: Test run transitions**

Expected legal transitions:

```ts
queued -> running
running -> awaiting_input
running -> succeeded
running -> failed
running -> cancelled
awaiting_input -> running
```

- [ ] **Step 2: Implement event JSONL writer**

Every event includes:

```ts
{ id: string; runId: string; type: string; createdAt: string; payload: unknown }
```

- [ ] **Step 3: Implement SSE event stream**

Expose:

```text
GET /api/runs/:runId/events
```

- [ ] **Step 4: Implement cancel**

Store cancellation signal and call child process abort for agent/media runs.

- [ ] **Step 5: Verify**

Run:

```powershell
rtk npm test -- daemon/runs/store.test.ts
```

## Task 5: Runtime Registry And Parsers

**Files:**
- Create: `daemon/runtimes/types.ts`
- Create: `daemon/runtimes/registry.ts`
- Create: `daemon/runtimes/capabilities.ts`
- Create: `daemon/runtimes/invocation.ts`
- Create: `daemon/runtimes/parsers/claude.ts`
- Create: `daemon/runtimes/parsers/codex.ts`
- Create: `daemon/runtimes/parsers/gemini.ts`
- Create: `daemon/runtimes/parsers/plain.ts`
- Test: `daemon/runtimes/parsers.test.ts`
- Modify: `lib/daemon/agents.ts`

- [ ] **Step 1: Write parser fixture tests**

Codex JSON error fixture:

```json
{"type":"error","message":"The 'gpt-5.5' model requires a newer version of Codex."}
```

Expected normalized event:

```ts
{ type: "error", code: "not_found_model", message: "The 'gpt-5.5' model requires a newer version of Codex." }
```

- [ ] **Step 2: Implement capability map**

Represent capabilities per agent and expose them through `GET /api/agents`.

- [ ] **Step 3: Implement invocation strategy**

Use stdin first, temp file second, argv only when safe.

- [ ] **Step 4: Replace simple text runner behind existing API**

Keep `runAgentText` compatibility by consuming normalized events and returning final text.

- [ ] **Step 5: Verify**

Run:

```powershell
rtk npm test -- daemon/runtimes/parsers.test.ts lib/daemon/agents.test.ts
```

## Task 6: Fallback Policy

**Files:**
- Create: `daemon/fallback/types.ts`
- Create: `daemon/fallback/policy.ts`
- Test: `daemon/fallback/policy.test.ts`
- Modify: `lib/providers/generation.ts`
- Modify: `app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Test fallback order**

Given selected Codex fails with `not_found_model`, detected Claude exists, OpenAI BYOK configured.

Expected:

```ts
["codex", "claude", "openai"]
```

- [ ] **Step 2: Emit fallback events**

Events:

```ts
{ type: "fallback.started", from: "codex", to: "claude", reason: "not_found_model" }
{ type: "fallback.used", route: "claude" }
```

- [ ] **Step 3: Show fallback in UI**

Settings and run detail show actual route used.

- [ ] **Step 4: Verify**

Run:

```powershell
rtk npm test -- daemon/fallback/policy.test.ts lib/providers/generation.test.ts
```

## Task 7: Provider Catalog And Media Tool

**Files:**
- Create: `daemon/media/models.ts`
- Create: `daemon/media/providers/openai.ts`
- Create: `daemon/media/providers/volcengine.ts`
- Create: `daemon/media/providers/stub.ts`
- Create: `daemon/media/tasks.ts`
- Create: `daemon/routes/media.ts`
- Modify: `scripts/open-studio.mjs`
- Test: `daemon/media/models.test.ts`
- Test: `daemon/media/tasks.test.ts`

- [ ] **Step 1: Port model catalog**

Include image, hidden video and hidden audio providers from the SDD.

- [ ] **Step 2: Implement task store**

Statuses:

```ts
"queued" | "running" | "succeeded" | "failed" | "cancelled"
```

- [ ] **Step 3: Implement OpenAI image provider**

Support OpenAI and Azure OpenAI base URL shape.

- [ ] **Step 4: Implement explicit stub provider**

Stub writes labelled placeholder only when demo/stub mode is active.

- [ ] **Step 5: Implement CLI commands**

Commands:

```powershell
rtk proxy node scripts/open-studio.mjs media generate --surface image --prompt "test" --model stub-image
rtk proxy node scripts/open-studio.mjs media wait <taskId>
rtk proxy node scripts/open-studio.mjs media cancel <taskId>
```

- [ ] **Step 6: Verify**

Run:

```powershell
rtk npm test -- daemon/media/models.test.ts daemon/media/tasks.test.ts
```

## Task 8: Research And Title Pack

**Files:**
- Create: `daemon/research/tavily.ts`
- Create: `daemon/research/report.ts`
- Create: `daemon/titles/scoring.ts`
- Create: `daemon/routes/research.ts`
- Modify: `app/api/generate/titles/route.ts`
- Modify: `app/(dashboard)/content/page.tsx`
- Modify: `app/(dashboard)/pipeline/page.tsx`
- Test: `daemon/titles/scoring.test.ts`
- Test: `app/api/generate/titles/route.test.ts`

- [ ] **Step 1: Remove arbitrary topic limit**

Validation accepts long text and trims only extreme payloads by request size policy, not 500 chars.

- [ ] **Step 2: Test 10 title candidates**

Expected:

```ts
expect(result.candidates).toHaveLength(10);
expect(result.top3).toHaveLength(3);
```

- [ ] **Step 3: Implement Tavily research service**

Write `research/<slug>.md` and JSON source list.

- [ ] **Step 4: Implement title scoring parser**

Reject malformed outputs and retry once with repair prompt.

- [ ] **Step 5: Persist title pack**

Write `files/titles.json` in project and update `package.json`.

- [ ] **Step 6: Verify UI sync**

Pipeline and `/content` read the same latest title pack for the active project.

## Task 9: Captions

**Files:**
- Modify: `app/api/generate/captions/route.ts`
- Modify: `app/(dashboard)/content/page.tsx`
- Modify: `app/(dashboard)/pipeline/page.tsx`
- Create: `daemon/captions/pattern.ts`
- Test: `daemon/captions/pattern.test.ts`

- [ ] **Step 1: Block empty pattern**

Expected response:

```json
{
  "ok": false,
  "code": "caption_pattern_required"
}
```

- [ ] **Step 2: Persist caption pattern**

Save pattern in memory and project when user provides it.

- [ ] **Step 3: Generate captions with pattern**

Write `files/captions.json`.

- [ ] **Step 4: Verify**

Run:

```powershell
rtk npm test -- daemon/captions/pattern.test.ts
```

## Task 10: Prompt Composer, Skills, Memory, Brand Kit

**Files:**
- Create: `daemon/prompts/composer.ts`
- Create: `daemon/skills/registry.ts`
- Create: `daemon/memory/store.ts`
- Create: `daemon/brand-kit/store.ts`
- Create: `daemon/routes/skills.ts`
- Create: `daemon/routes/memory.ts`
- Test: `daemon/prompts/composer.test.ts`
- Test: `daemon/skills/registry.test.ts`

- [ ] **Step 1: Test prompt layers**

Expected order:

```ts
["identity", "routine", "project", "request", "brandKit", "memory", "research", "media", "skills", "schema"]
```

- [ ] **Step 2: Implement skills scanner**

Scan `.open-studio/skills`, project `.agents/skills`, and user skill roots.

- [ ] **Step 3: Implement brand kit**

Store `BRAND.md` and `brand-kit.json`.

- [ ] **Step 4: Implement memory**

CRUD plus explicit extraction endpoint.

- [ ] **Step 5: Wire script variables, brand voice and references**

The buttons in `/scripts` become real controls backed by project/brand/memory data.

## Task 11: Critique And Export

**Files:**
- Create: `daemon/critique/package.ts`
- Create: `daemon/critique/scoreboard.ts`
- Create: `daemon/export/package.ts`
- Create: `daemon/routes/critique.ts`
- Modify: `app/api/exports/route.ts`
- Test: `daemon/critique/package.test.ts`
- Test: `daemon/export/package.test.ts`

- [ ] **Step 1: Test package critique**

Given weak thumbnail fit, expected `cohesionScore < 70` and reason string.

- [ ] **Step 2: Implement critique schema**

Score title, thumbnail, script and package coherence.

- [ ] **Step 3: Implement export bundle**

Create MD, JSON, HTML and ZIP first. Add PDF after browser renderer is wired.

- [ ] **Step 4: Verify**

Run:

```powershell
rtk npm test -- daemon/critique/package.test.ts daemon/export/package.test.ts
```

## Task 12: UI Wiring And End-To-End Verification

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx`
- Modify: `app/(dashboard)/scripts/page.tsx`
- Modify: `app/(dashboard)/content/page.tsx`
- Modify: `app/(dashboard)/thumbnails/page.tsx`
- Modify: `app/(dashboard)/pipeline/page.tsx`
- Modify: `app/(dashboard)/assets/page.tsx`
- Modify: `e2e/scripts-settings.spec.ts`
- Create: `e2e/package-flow.spec.ts`

- [ ] **Step 1: Settings**

Show execution route, agent status, BYOK provider status, media/research status and defaults.

- [ ] **Step 2: Scripts**

Variables, brand voice and references are editable and saved.

- [ ] **Step 3: Content**

Title pack and captions load from active project.

- [ ] **Step 4: Thumbnails**

Image generation uses selected image provider/media tool and writes asset metadata.

- [ ] **Step 5: Pipeline**

Pipeline creates project, run, package and export.

- [ ] **Step 6: E2E**

Run:

```powershell
rtk npm run test:e2e
```

Expected: package flow passes in demo/stub mode.

## Task 13: Final Verification

**Files:**
- Inspect all changed files.

- [ ] **Step 1: Run full unit suite**

```powershell
rtk npm test
```

- [ ] **Step 2: Run lint**

```powershell
rtk npm run lint
```

- [ ] **Step 3: Run build**

```powershell
rtk npm run build
```

- [ ] **Step 4: Run E2E**

```powershell
rtk npm run test:e2e
```

- [ ] **Step 5: Manual smoke**

Start app:

```powershell
rtk npm run dev
```

Verify:

- `/settings`: detects CLIs, provider defaults persist.
- `/scripts`: generation, variables, brand voice, references.
- `/content`: 10 titles, top 3, captions.
- `/thumbnails`: image provider selection and generated asset.
- `/pipeline`: full package.
- `/assets`: generated files.
- export download.

