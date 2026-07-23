# Anti-Pattern Gallery (numbered case compendium)

> **Usage**: before finishing MD / code / running a reverse sync, do a pass against this table. During code review you can cite the ID directly (e.g. "this is AP-06 here") to avoid copying long rule passages.
> Each anti-pattern has a corresponding source rule; for details go back to `references/conventions/<file>.md`.
>
> **Not an exhaustive list** — it only collects the most commonly hit and most easily missed ones. When a new pit appears, add a new entry + cite the corresponding rule.

## Numbering convention

| Prefix | Category | Source |
| --- | --- | --- |
| `AP-MD-*` | Markdown-document related | `conventions/markdown.md` |
| `AP-CD-*` | Code / comment related | `conventions/code.md` |
| `AP-SY-*` | Reverse sync / meta-info related | `conventions/sync.md` |
| `AP-CS-*` | commit / sync-only flow related | `conventions/commit-sync.md` |
| `AP-DS-*` | `.fibo/docs/` document system related | `conventions/docs-system.md` |

---

## AP-MD-* Markdown / paths / jump tags

| ID | Wrong | Right | One-line reason | Source |
| --- | --- | --- | --- | --- |
| AP-MD-01 | `href="/src/foo.ts?class=code"` | `href="#src/foo.ts?class=code"` | href must start with `#`, the path does not start with `/` | markdown.md §2 |
| AP-MD-02 | `href="#C:/Users/.../foo.ts?class=code"` | `href="#src/foo.ts?class=code"` | Absolute paths are forbidden | markdown.md §2 |
| AP-MD-03 | Tag text `Code: UserService.ts` | `Code: src/services/UserService.ts` | Tag text must be the full relative path, not just the filename | markdown.md §2 |
| AP-MD-04 | Tag text `Document: services` | `Document: src/services/index.md` | Cannot write only the directory name | markdown.md §2 |
| AP-MD-05 | `href="#src/foo.ts"` | `href="#src/foo.ts?class=code"` | `?class=code` must be carried | markdown.md §3 |
| AP-MD-06 | `href="#src/foo.ts?class=function"` | `href="#src/foo.ts?class=code"` | A code tag's class is fixed as `code` | markdown.md §3 |
| AP-MD-07 | `href="#src/foo.ts?type=code"` | `href="#src/foo.ts?class=code"` | The parameter name must be `class`, not `type` | markdown.md §3 |
| AP-MD-08 | `src/foo.ts#parseConfig` (anchoring by symbol name) or a single line written as `src/foo.ts:45-45` | `src/foo.ts:120-155` (line range) or `src/foo.ts:45` (single line) | This project anchors uniformly by line number; single line uses `:number`, `#symbolName` is forbidden | markdown.md §3.1 |
| AP-MD-09 | `href="#docs/api/UserService.md"` | `href="#docs/api/UserService.md?class=text"` | `?class=text` must be carried | markdown.md §4 |
| AP-MD-10 | `href="#docs/x.md?class=md"` | `href="#docs/x.md?class=text"` | A document tag's class is fixed as `text` | markdown.md §4 |
| AP-MD-11 | `href="#docs/api/UserService"` | `href="#docs/api/UserService.md?class=text"` | href must end with `.md` | markdown.md §4 |
| AP-MD-12 | `href="#docs/x.html?class=text"` | `href="#docs/x.md?class=text"` | The suffix must be `.md` | markdown.md §4 |
| AP-MD-13 | `Document: UserService.md` | `Document: docs/api/UserService.md` | Tag text must be the full relative path | markdown.md §4 |
| AP-MD-14 | `File details: xxx` / `Design doc: xxx` | `Code: ...` / `Document: ...` | Tag text must use the standard English prefix; localized or non-standard prefixes are forbidden | markdown.md §4 |
| AP-MD-15 | Key flow listed as text only | Add a Mermaid flowchart / state diagram / sequence diagram | Key logic must be diagrammed (MD scenarios only) | markdown.md §1 |
| AP-MD-16 | Mermaid nodes use `A/B/C/D` | Nodes use semantic naming (e.g. `user login`) | Node naming must be semantic | markdown.md §1 |
| AP-MD-17 | A single Mermaid with 50+ nodes | Split into multiple, ≤ 15 nodes each | Complex diagrams must be split | markdown.md §1 |
| AP-MD-18 | The generated / updated MD lacks a meta-info block at the end | Write the three fields `name/update-time/description` at the end | An MD artifact must be searchable, locatable, syncable | markdown.md §0 |
| AP-MD-19 | In the meta-info block, `name/update-time/description` are crammed together, or `description` is immediately followed by the closing `---` | Keep one blank line below each of the three fields, and one blank line after `description` before the `---` | Spacing between meta-info fields affects rendering and readability | markdown.md §0 |

## AP-CD-* Code / comments

| ID | Wrong | Right | One-line reason | Source |
| --- | --- | --- | --- | --- |
| AP-CD-01 | Function name `handle()` / `process()` | `parseUserConfig()` / `validateEmail()` | Start with a verb, express "what it does" | code.md §1 |
| AP-CD-02 | Variable name `data` / `info` / `tmp` | `parsedConfig` / `pendingEvents` | Nouns made concrete, avoid empty words | code.md §1 |
| AP-CD-03 | Boolean `loaded` / `valid` | `isLoaded` / `isValid` | Booleans use `is/has/can/should` prefixes | code.md §1 |
| AP-CD-04 | Constant `maxRetry` | `MAX_RETRY` | Constants use `UPPER_SNAKE_CASE` | code.md §1 |
| AP-CD-05 | Pinyin naming (e.g. `huoQuYongHu`) | English (`fetchUser`) | Pinyin is forbidden | code.md §1 |
| AP-CD-06 | `// i increments by 1` (code-translation style) | State "why +1" (e.g. "skip the header row") | Comments state WHY not WHAT | code.md §2 |
| AP-CD-07 | Code changed but an old comment inconsistent with the new behavior is left behind | Update the comment together with the code | Comment and code must stay in sync | code.md §3 |
| AP-CD-08 | Code deleted but a leftover comment kept | Delete the comment along with it | Delete code along with its comment | code.md §3 |
| AP-CD-09 | After renaming a function / parameter the comment still uses the old name | Sync the referenced name in the comment | After renaming, comments must be synced | code.md §3 |
| AP-CD-10 | Copying a large chunk of the design doc verbatim into a comment | The comment only "points the way + WHY", the original text stays in `.fibo/docs/` | Documents are the docs' job, comments only point the way | code.md §4 |
| AP-CD-11 | Cramming a spec/design anchor into an ordinary CRUD utility function | Add it only when "a key decision lands / the intent needs a doc to explain" | Omit when the trigger conditions are not met | code.md §4.1, §4.4 |
| AP-CD-12 | `spec: /docs/foo.md` (absolute path) | `spec: .fibo/docs/specs/<feature>/spec.md#AC-03` | References must be relative paths | code.md §4.2 |
| AP-CD-13 | Isolated numbers in comments like `// task-09` / `// D5` / `// AC-3` | Must carry the filename + anchor: `spec: spec.md#AC-03` | Isolated numbers detached from context are baffling | code.md §4.2, §4.4 |
| AP-CD-14 | A single-line comment crammed with ≥ 3 anchors | Switch to the multi-line block-comment format | A single line holds at most 2 anchors | code.md §4.2 |
| AP-CD-15 | The referenced `.md` file was renamed / deleted but the comment did not follow | Same source as §3, sync the reference | Doc renamed → sync the comment | code.md §4.4 |
| AP-CD-16 | Skipping the §5 self-check checklist before wrap-up delivery | Must run the K1–K7 self-check | Finishing code must run the self-check | code.md §5 |
| AP-CD-17 | Multiple `spec:` / `design:` references in a JSDoc crammed together consecutively | Each reference on its own line, with an empty comment line between reference lines | The hover tooltip needs the empty comment line to render line breaks | code.md §4.2 |

## AP-SY-* Reverse sync / meta-info block

| ID | Wrong | Right | One-line reason | Source |
| --- | --- | --- | --- | --- |
| AP-SY-01 | Autonomously scanning "seemingly related" historical MD to add anchors | Only touch MD the user mentioned this session / AI-generated MD / the corresponding spec.md | The sync target has a whitelist | sync.md §1.1 |
| AP-SY-02 | Modifying README / CHANGELOG / third-party docs | Skip these documents | Docs outside the whitelist must not be modified | sync.md §1.1 |
| AP-SY-03 | Directly changing an old AC business rule into the new rule | Keep the old AC and mark `stale, for reference only` nearby + the code source of truth | For a living contract conflict, code wins, but the historical rule is not lost | sync.md §2.1 |
| AP-SY-04 | Deleting a design description that has not become invalid | Keep the original description, only add the implementation anchor | Do not damage existing content | sync.md §2 |
| AP-SY-05 | Modifying the design doc's chapter structure / heading levels / Mermaid diagrams | Do not touch these | Sync only adds/fixes implementation details | sync.md §2 |
| AP-SY-06 | Writing the meta-info block in the middle of the document | Write it at the very end of the document | The position is fixed | sync.md §2.2 |
| AP-SY-07 | The generated / updated MD lacks any of `name` / `update-time` / `description` | All generated / updated MD fill all three fields | The three fields are the unified retrieval and sync contract | sync.md §2.2 |
| AP-SY-07a | `description` written as multiple lines / an overlong paragraph (≥ 60 chars) | Summarize the topic and scope in one sentence | description is a retrieval summary, not body text | sync.md §2.2 |
| AP-SY-09 | Stacking multiple meta-info blocks in the same document | Overwrite-refresh, keep only the latest one | The meta-info block is a singleton | sync.md §2.2 |
| AP-SY-10 | Writing `update-time: 2026-05-15 09:00` from memory | Run a command to measure the current time | Time hallucination is forbidden | sync.md §2.3 |
| AP-SY-11 | `update-time: 2026-05-15 09:00:15` (with seconds) | `update-time: 2026-05-15 09:00` | Format is precise to the minute, no seconds/timezone | sync.md §2.3 |
| AP-SY-12 | Reusing the previous update-time value for the second update in the same session | Re-run the command each time to get the current time | Time values are not reused | sync.md §2.3 |
| AP-SY-13 | Adjudicating a doc conflict from conversation history / memory | Launch an Explore sub-agent to actually read the code | Adjudication must be fact-based | sync.md §5 |
| AP-SY-14 | The sub-agent adjudicates but the source of truth is not written down | Write "based on `src/foo.ts:120-155`" in the report | A trace must be left | sync.md §5 |
| AP-SY-15 | Silently changing the doc to paper over when the code itself is in doubt | Stop and report to the user | When code is unclear, do not act on your own | sync.md §5 |
| AP-SY-16 | Inventing a new state (e.g. "partially updated") in the sync report | Only use `Updated` / `Not-updated` / `No-update-needed` | The state enum has only three | sync.md §4 |
| AP-SY-17 | "Not-updated" without a reason | List the reason (waiting for user confirmation / implementation unstable, etc.) | Not-updated must be explained | sync.md §4 |
| AP-SY-18 | Skipping the sync self-check at task wrap-up | Must walk the sync.md §3 self-check flow diagram | The wrap-up self-check cannot be skipped | sync.md §3 |
| AP-SY-19 | The feature has a real code diff but wrap-up only syncs spec/design/plan, no diff.md generated or refreshed | Call `fibo-recording-diff` to generate / refresh `diff.md` from the real diff, and list its status in the report | diff.md participates in the sync equally with spec/design/plan | sync.md §2 |
| AP-SY-20 | Directly deleting the old AC / old diff explanation on a doc conflict | Keep the original entry and mark `stale, for reference only`, attach the code source of truth | Stale history must be traceable | sync.md §2.1 / §5 |
| AP-SY-21 | On a doc conflict still deferring to the old spec and demanding the code be changed | Read the code first; when the code facts are clear, code wins — update the doc and mark stale items | Reverse sync defers to the current code facts | sync.md §1 / §5 |

## AP-CS-* commit / sync-only flow

| ID | Wrong | Right | One-line reason | Source |
| --- | --- | --- | --- | --- |
| AP-CS-01 | The user did not say commit / sync, the AI triggers the flow on its own | Wait for the user's explicit request | Do not decide the commit timing for the user | commit-sync.md §1 |
| AP-CS-02 | Guessing the working-tree state from conversation history | Actually run `git status` / `git diff` each time | Operating git from memory is forbidden | commit-sync.md §4 |
| AP-CS-03 | `git add -A` / `git add .` | `git add <file1> <file2> ...` listed explicitly | Prevent accidentally committing sensitive / large files | commit-sync.md §4 |
| AP-CS-04 | On a sync-only trigger, acting directly without warning about uncommitted changes | Warn first and wait for the user's reply | sync-only must warn | commit-sync.md §2 |
| AP-CS-05 | Quietly modifying MD but producing no sync report | Must output a report after modifying | If you modified, you must report | commit-sync.md §8 |
| AP-CS-06 | Skipping the `.fibo/index.json` update | Update hash + time on every sync | index.json must advance | commit-sync.md §8 |
| AP-CS-07 | `lastSyncHash: "abc1234"` (short hash) | `lastSyncHash: "abc1234..."` full 40-char SHA | Must be the full SHA | commit-sync.md §3 |
| AP-CS-08 | Searching only MD under `.fibo/docs/` | Search the whole repo `**/*.md`, excluding vendored | Candidate MD must be searched repo-wide | commit-sync.md §6 |
| AP-CS-09 | On a business-rule conflict, deleting the old rule or silently rewriting it | Update the effective description with code as the truth, and mark the old rule `stale, for reference only` | Conflicting history must be traceable | commit-sync.md §6 |
| AP-CS-10 | Still updating `index.json` when the code facts are unclear | Do not touch index.json when paused | The paused state keeps the old hash | commit-sync.md §8 |
| AP-CS-11 | Modifying a snapshot report under `reports/` | Report-type docs do not participate in the sync | reports are snapshots | commit-sync.md §7 / docs-system.md §2 |
| AP-CS-12 | commit-sync skips `diff.md` as a reports snapshot | Treat `diff.md` as a living contract on par with spec/design/plan, refreshed only from a real diff | diff.md participates in the sync but hunks cannot be backfilled from memory | commit-sync.md §6 / §8 |
| AP-CS-13 | In commit-sync, on hitting a stale spec/diff, directly changing it to the new rule without leaving a stale mark | Append `stale, for reference only` nearby, and write the source of truth in the report | Incremental sync must preserve historical context | commit-sync.md §6 / §7 |

## AP-DS-* `.fibo/docs/` document system

| ID | Wrong | Right | One-line reason | Source |
| --- | --- | --- | --- | --- |
| AP-DS-01 | New-feature MD scattered in `src/` or the project root | Landed in `.fibo/docs/specs/<feature>/spec.md` | Engineering docs are funneled uniformly | docs-system.md §1 |
| AP-DS-02 | feature directory `AuthLogin/` or `auth_login/` | `auth-login/` hyphen-lowercase | feature directory naming convention | docs-system.md §4 |
| AP-DS-03 | ADR file `decision-token.md` | `0003-token-store.md` 4-digit sequence + slug | ADR must have a 4-digit sequence | docs-system.md §4 |
| AP-DS-04 | ADR lacks a Why-not section | Must list the rejected options + reasons | ADR must contain Why-not | docs-system.md §3 |
| AP-DS-05 | The spec's AC uses free text | AC uses EARS phrasing (Ubiquitous / Event-driven / State-driven / Optional / Unwanted) | AC must be EARS | docs-system.md §3 |
| AP-DS-06 | Report filename has no date or uses the `{topic}-{YYYYMM}.md` form (e.g. `bundle-size-202605.md`) | Fixed `{YYYY-MM-DD}-{topic}.md`, e.g. `2026-05-13-bundle-size.md` | A single-file report must have a date prefix + topic | docs-system.md §4 |
| AP-DS-07 | Modifying the conclusion of a published ADR under `decisions/` | Create a new ADR, mark the original `superseded by` | ADRs are immutable | docs-system.md §2 |
| AP-DS-08 | When one investigation produces ≥ 2 reports, laying them flat in the `reports/` root (e.g. `2026-05-20-auth-audit-overview.md` / `2026-05-20-auth-audit-findings.md`) | Create a `reports/auth-audit/` subdirectory (directory name without date) to group them, containing one `README.md` summarizing each report, the rest being topic-named report files | Multiple reports must get a subdirectory | docs-system.md §3 |
| AP-DS-09 | After creating a subdirectory under `reports/`, not placing a `README.md`, so its contents can only be found by digging | Add a `README.md` in the subdirectory collecting the file list and a one-line summary of each (constrains `reports/` only) | reports subdirectories must add a README for navigation | docs-system.md §3 |
| AP-DS-10 | Marking `specs/<feature>/diff.md` as an optional snapshot / not participating in the sync | Write it as a living contract on par with spec/design/plan, maintained by `fibo-recording-diff` from the real diff | The feature quartet have equal status | docs-system.md §2 |
| AP-DS-11 | On a living-contract conflict, moving the old doc to reports or deleting it | Keep it inside the original feature doc and mark `stale, for reference only` | The quartet are living contracts, historical context is not lost | docs-system.md §3 |
| AP-DS-12 | Placing `plan.md` / `diff.md` directly under a big-feature directory `specs/<epic>/` | The big-feature layer only has spec.md + a splitting design.md; implementation-layer artifacts sink into sub-feature directories | A big-feature directory has no implementation-layer artifacts | docs-system.md §3.1 |
| AP-DS-13 | Laying a big feature's sub-features flat in the `specs/` root (e.g. `specs/epic-x-sub-a/`) | Nest them inside the big-feature directory: `specs/<epic>/<sub-feature>/` | Sub-features must be nested | docs-system.md §3.1 |
| AP-DS-14 | A big feature's design.md writes implementation details (file list / interface contracts / concrete function changes) | Write only the splitting logic: sub-feature list / dependency order / total AC mapping / status table | The splitting design only answers "how to split" | docs-system.md §3.1 |
| AP-DS-15 | After the epic spec is signed, auto-generating all sub-specs, no longer signing each | Each sub-feature's spec goes back to `fibo-brainstorming` for draft → sign-off individually | Each sub-spec must be signed individually | docs-system.md §3.1 |
| AP-DS-16 | The user riffs off a stray idea and the AI proactively creates `ideas/{topic}.md` to archive it | Persist only when the user **explicitly asks** "record my idea / save this idea" | Persisting an idea requires an explicit user trigger | docs-system.md §3 |
| AP-DS-17 | When recording an idea, writing it down once and done, marking `clarified` while the scenario / boundaries are still vague | Walk the clarification loop: keep asking the user, hang open questions in §4, keep Status `clarifying` until cleared | ideas is a requirements-clarification activity | docs-system.md §3 |
| AP-DS-18 | Writing §3 feasibility as `feasible` from memory, without reading code | Actually read the relevant code (can dispatch Explore) before giving a conclusion and leaving a code anchor | The feasibility assessment must be code-backed | docs-system.md §3 |

---

## Usage suggestions

1. **After writing docs / code**: scan the matching category (e.g. if you touched MD, walk AP-MD-*)
2. **At task wrap-up self-check**: must check all of AP-SY-*
3. **During code review**: cite by ID to avoid long quotations
4. **On finding a new pit**: append an ID in the matching category + link back to the conventions file
5. **Onboarding a newcomer**: read this table first, it ramps faster than reading the 1000+ line SKILL.md

---
name: Collaboration Conventions Anti-Pattern Gallery (anti-patterns)

update-time: 2026-07-09 05:43

description: Anti-pattern quick reference, covering quartet sync, diff maintenance, big-feature splitting, report date-prefix naming and the multi-file report subdirectory rule, the stale-item marking rule, and ideas idea persistence (requires a user trigger + clarification loop + read code to assess feasibility) anti-patterns

---
