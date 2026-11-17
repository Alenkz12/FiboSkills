# Analysis writing and structure resources

This directory bundles reusable copies of Fibo's built-in resources. Use the current writing set for guides, and the separate extraction set only for machine facts. Locators below are relative to this directory. Production call sites and effective configuration determine application behavior; this bundle is not a runtime override.

## 1. Direct-Markdown writing set

| Resource locator | Purpose | Read when |
| --- | --- | --- |
| `analysisGuide.prompt.md` | Exploration, language, reader scope and finite DSL | Authoring any guide |
| `analysisNavigation.prompt.md` | Standalone and compact code/text/graph navigation | Emitting tags or choosing presentation |
| `analysisLayout.code.template.md` | Code-file skeleton | Analyzing source code |
| `analysisLayout.config.template.md` | Configuration skeleton | Analyzing configuration |
| `analysisLayout.directory.template.md` | Non-root directory skeleton | Analyzing a directory |
| `analysisLayout.repository.template.md` | Root guide, verified setup/use and entry points | Analyzing root |
| `analysisRole.<role>.template.md` | Primary and supplementary reading lenses | Only selected roles |

There are 20 writing resources: two Prompts, four layouts and these 14 role Templates:

`entry`, `presentation`, `api-boundary`, `orchestration`, `domain-rules`, `data-contract`, `state-storage`, `external-adapter`, `infrastructure`, `configuration`, `extension-point`, `utility`, `test-verification`, `generated-resource`.

Read selection criteria and the finite DSL in `../template-dsl.md`. Choose roles from evidence; the physical unit fixes the layout. Compose common rules, one layout, primary role, sorted unique secondary roles and navigation. Substitute only declared host variables. Author final Markdown directly, without JSON wrapping or resource-maintenance blocks.

Read `analysisNavigation.prompt.md` for standalone cards and compact inline tags. Compact tags use short, unprefixed labels while retaining complete `href` targets; the navigation Prompt defines their theme colors, rounded corners, padding and graph metadata boundaries.

## 2. Structure-extraction resources

| Resource locator | Output / scope |
| --- | --- |
| `structureDescription.prompt.md` | Exact skeleton key → description JSON |
| `codeAnalysis.prompt.md` | Generic whole-file FileMeta fallback |
| `codeAnalysis.<language>.prompt.md` | Existing language-specific FileMeta fallback |
| `default.prompt.md` | Loader fallback for legacy extraction resources |

Specialized files cover `c`, `cpp`, `go`, `java`, `javascript`, `typescript`, `python` and `cangjie`. This is a resource inventory, not the parser-support list. Read `../structure-schema.md` before editing. New prompts alone do not extend file discovery or language mapping.

Retired `fileSummary`, `configSummary`, `folderSummary` and `folderSubItem` writing resources are not bundled. Do not restore their JSON article shell, compressed-child model pass, full-structure appendix or failure-placeholder behavior. Legacy copies elsewhere do not make them the default path.

## 3. Executable artifact tool

The skill-root locator `scripts/analysis-artifacts.cjs` is this skill's independently maintained CommonJS tool. It provides real-input sessions, source/discovery/template reads, three-file publication and cache verification using Node built-ins. Use `../pipeline.md` §6 for JSON command transport. State is always computed by this tool, not written by the model. The backend maintains its own TypeScript implementation. Keep both compatible through path, fingerprint and state parsing tests plus real skill-process tests; no source-file equality, backend build output or automatic copying is required.

Writing resources define article content and tags. The tool defines paths, hashes, state and acceptance. Updating a Prompt does not by itself generate a state file or invoke analysis.

## 4. Refreshing the bundle

The 20 writing resources are exact snapshots of application defaults at the location below. Refresh their built-in text intact and preserve source metadata. The existing extraction prompts retain this skill's English wording; compare their extraction contract before changing them rather than translating them during a writing-resource refresh. Skill-owned references describe orchestration and compatibility boundaries. Check the registry instead of trusting an old count or language list.

<div style="display: flex; align-items: flex-end;"><span style="background-color: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;"><a target="_self" href="#backend/src/analyse/prompts/README.md?class=text" style="color: inherit; text-decoration: none;">Document: backend/src/analyse/prompts/README.md</a></span></div>

<div style="display: flex; align-items: flex-end;"><span style="background-color: var(--tag-code-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-code-border); color: var(--tag-code-fg); font-size: 14px; font-weight: 500;"><a target="_self" href="#backend/src/config/analysis-resource-registry.ts?class=code" style="color: inherit; text-decoration: none;">Code: backend/src/config/analysis-resource-registry.ts</a></span></div>

Live Fibo overrides take priority over built-ins. Updating this bundle changes skill guidance only: it does not save overrides, clear backend caches, start analysis or rewrite artifacts. See `../template-dsl.md` for configuration timing and `../pipeline.md` for host execution.

---
name: Analysis writing and structure resources

update-time: 2026-10-23 15:29

description: Current direct-Markdown writing inventory, retained structure prompts and source-aligned bundle maintenance.

---
