---
name: fibo-brainstorming
description: Use this BEFORE any change that alters externally-visible behavior, AC, or contracts — including new features, new specs, AC modifications on existing specs, and "looks-like-bugfix-but-changes-behavior" cases. Runs a clarify → AC → draft → self-review → concise scope summary → sign-off loop before any spec.md is created/modified under .fibo/docs/specs/. Produces testable EARS AC with explicit error paths, asks ONE question at a time with multiple-choice when possible, and obtains explicit approval through a plain-language summary of what will and will not be done. After approval, writes the full spec and auto-chains planning, implementation, and verification. Does NOT write production code, run tests, or commit during brainstorming.
---

# Fibo brainstorming pre-stage skill

> This skill is the **mandatory pre-stage** before any change that **alters externally-visible behavior / AC / contracts**.
> Goal: turn "the user's vague intent" into a complete spec draft, obtain approval through a short summary of what will and will not be done, and **only then** file or modify `.fibo/docs/specs/<feature>/spec.md`.

---

## When to use (3-tier trigger)

```mermaid
flowchart TD
  change_request_001["User raises a change request"] --> change_type_002{"What is being changed?"}
  change_type_002 -->|New feature / new module<br/>no existing spec| full_mode_003["Full mode<br/>run Step 0–6"]
  change_type_002 -->|Existing spec, modify/add AC<br/>or change Non-goals| lightweight_mode_004["Lightweight mode<br/>skip Step 1 clarification<br/>go to candidate AC → sign-off"]
  change_type_002 -->|"Bugfix/refactor may alter visible behavior"| clarification_mode_005["Clarification-only<br/>run the Step 0 judgment"]
  change_type_002 -->|Pure bugfix/refactor or typo/rename/comment| direct_flow_006["Do not enter this skill<br/>proceed directly"]
```

**Full mode (must run the complete flow)**:
- User says "I want to add an X feature", "we need to do Y", "help me build a Z module"
- User says "I don't know how to do this", "how should this be designed"
- The task requires **creating** a new `.fibo/docs/specs/<feature>/` directory

**Lightweight mode (changing behavior on an existing spec, skip clarification)**:
- **Adding a new AC** / **modifying an existing AC** / **changing Non-goals** on an existing spec
- Making a "behavior tweak" within the scope of an existing spec (e.g. changing a default value, changing an error-handling path)
- → Start directly from Step 2 (candidate AC), continuing the AC numbering off the existing spec's numbers

**Clarification-only (first confirm whether entering this skill is really needed)**:
- User says "just fix a bug" but the description contains "going forward it should…", "I want it to…" (actually a behavior change)
- User says "just refactor" but also changes the external interface / config item / return structure along the way
- → Use **1 multiple-choice question** to clarify: "Will this change alter (A) function signature / return value (B) error messages / error codes (C) config items / default values (D) none of the above".
  - Choose (D) → exit this skill, proceed directly
  - Choose (A)/(B)/(C) → escalate to Lightweight mode and continue

**Scenarios where you do NOT enter this skill**:
- Pure bugfix (behavior unchanged, just fixing what was "wrong" to be right)
- Pure refactor (external interface / AC completely unchanged)
- Single-file single-line typo, comment fix, variable rename
- User is writing an ordinary document (not a spec / design document)

---

## Core principles

1. **No writing code, no touching files, no commit before sign-off**: prepare the complete draft without writing it to disk; the default user-facing output is a short scope summary. Show the full draft in a code block only if the user asks
2. **Draft does not enter the repo**: before the user signs off, never create / modify `.fibo/docs/specs/<feature>/spec.md`
3. **AC uses EARS syntax**: avoid natural-language ambiguity
4. **One question at a time, multiple-choice preferred**: if you can offer (A)/(B)/(C) options, don't ask open-ended questions
5. **Only ask trade-off questions**: if one candidate is clearly better (matches user intent / is a better design / lower risk), decide it directly, **no need to consult**; only ask the user when a real trade-off exists (each has pros and cons / it affects the AC direction)
6. **Open questions do not enter the spec**: all questions are settled within the dialogue; you **must not** write `Open questions` / `TBD` wording into the on-disk spec.md
7. **Draft first, summarize for one sign-off**: ask only the clarification questions that are actually needed; once settled, or when the request is already sufficiently specified, prepare and self-review the complete draft, then present one concise summary of what will and will not be done. Approval of that summary approves the corresponding full draft; do not require a separate full-text review or confirm scope, intent, AC, or boundaries in separate chunks
8. **Stop and ask when something is ambiguous**, don't fill in the blanks for the user
9. **Draft and summary language follow the triggering request**: write the summary, any requested full draft, and the eventual on-disk spec in the language used by the user in the request that triggered this flow, unless the user explicitly requires another language. Keep fixed technical tokens, code, paths, identifiers, and format markers unchanged

---

## Main flow

```mermaid
flowchart TD
  user_request_001["User raises a need"] --> scope_gate_002["Step 0: Scope gate<br/>do we need to split into sub-projects?"]
  scope_gate_002 -->|Too big and user chooses to split| epic_mode_003["Enter large-feature split mode<br/>see Step 0.5: first align the master spec<br/>then run the full chain per sub-feature"]
  epic_mode_003 --> clarify_intent_004
  scope_gate_002 -->|Right size| clarify_intent_004["Step 1: Clarify intent only when needed<br/>single question + multiple-choice preferred; 0–5 rounds"]
  clarify_intent_004 --> candidate_ac_005["Step 2: Candidate AC<br/>EARS syntax + numbering"]
  candidate_ac_005 --> define_boundaries_006["Step 3: Boundaries and Non-goals"]
  define_boundaries_006 --> resolve_tradeoffs_007["Step 4: Resolve trade-off questions in dialogue<br/>discussed only in dialogue, settled once discussed<br/>does not enter the spec"]
  resolve_tradeoffs_007 --> draft_spec_008["Step 5: Prepare complete spec draft<br/>keep off disk; full text on request"]
  draft_spec_008 --> review_draft_009["Step 5.5: Pre-disk self-review<br/>run self-review checklist<br/>stay silent if it passes"]
  review_draft_009 -->|Issue found| candidate_ac_005
  review_draft_009 -->|Passed| summarize_scope_010["Step 5.6: Short summary<br/>what will and will not be done"]
  summarize_scope_010 --> user_signoff_011{"Step 6: User approves summary?"}
  user_signoff_011 -->|Revise and come back| candidate_ac_005
  user_signoff_011 -->|Cancel| terminate_flow_012["Terminate"]
  user_signoff_011 -->|Explicit OK / approved / go| auto_chain_013["Auto-chain:<br/>write the corresponding full spec.md →<br/>writing-plan shapes design/test/plan →<br/>executing-plan runs TDD + final verification<br/>until tasks and test gate are resolved"]
```

---

## Step 0: Scope gate (first judge whether a split is needed)

**Signals that trigger a split** (propose a split if any one is met):
- The one-sentence need contains ≥ 2 **independent subsystems** (e.g. "build a platform with chat, file storage, and billing")
- It involves ≥ 3 independent actors (developer + end user + third-party system + admin…)
- The implementation path spans ≥ 2 existing modules with no obvious reuse relationship between them

**How to propose**: use a single multiple-choice question; don't start asking details first.

> Example:
> "This need appears to cover three parts: [subsystem A], [subsystem B], [subsystem C]; a split is recommended. Please choose:
> (A) Go with large-feature split mode: create `specs/<epic>/` (master spec + split design), with each sub-feature having its own subdirectory running the full chain — recommended (independently verifiable, low risk, see Step 0.5)
> (B) Merge into 1 large feature, with subsystems as AC groups — suitable when the three are tightly coupled
> (C) Let me think more; for now focus on the [X] part"

**Do not enter Step 1** before scope is aligned, to avoid tearing down an entire spec later.

---

## Step 0.5: Large-feature split mode (entered after the user chooses to split in Step 0)

> Source of truth for directory structure and identification rules: `fibo-conventions/references/conventions/docs-system.md` §3.1.
> This step only defines the behavioral difference of the brainstorming stage; the on-disk conventions follow that file.

**In this mode, the subject of Steps 1–6 is the "master spec"**, differing from an ordinary feature as follows:

| Aspect | Ordinary feature | Large-feature master spec |
| --- | --- | --- |
| AC granularity | Can go directly down to implementation | **High-level AC** (describes end-to-end verifiable results, not bound to implementation details) |
| Extra sections | None | Must include `## Sub-feature boundary`: list each sub-feature's name (lowercase hyphenated English) + a one-sentence responsibility + its parent master AC |
| On-disk location after sign-off | `specs/<feature>/spec.md` | `specs/<epic>/spec.md` |
| Chaining after sign-off | `fibo-writing-plan` produces design + test + plan | `fibo-writing-plan` **Epic mode**: produces the split design.md + epic test.md, **not plan.md** |

**Chaining order after the master spec is signed off**:

```mermaid
flowchart TD
  epic_signed_001["Master spec signed and written to disk<br/>specs/&lt;epic&gt;/spec.md"] --> epic_design_002["Invoke fibo-writing-plan Epic mode<br/>produce split design.md + epic test.md"]
  epic_design_002 --> sub_brainstorm_003["Following the split design's dependency order<br/>take the next sub-feature<br/>return to this skill to draft the sub-spec"]
  sub_brainstorm_003 --> sub_sign_004{"Sub-spec user sign-off?"}
  sub_sign_004 -->|OK| sub_chain_005["Write specs/&lt;epic&gt;/&lt;sub&gt;/spec.md to disk<br/>→ design/test/plan → TDD + final verification<br/>→ recording-diff"]
  sub_chain_005 --> status_006["Write back the large-feature design.md status table"]
  status_006 -->|More sub-features remain| sub_brainstorm_003
  status_006 -->|All sub-features verified PASS| epic_verify_007["Run epic test.md cross-feature gates"]
  epic_verify_007 -->|PASS| done_008["Prompt the user to trigger commit-sync"]
  epic_verify_007 -->|FAIL| repair_route_009["Locate affected sub-feature<br/>return to planning/execution"]
  repair_route_009 -->|After affected pipeline resolves| epic_verify_007
  epic_verify_007 -->|Explicit WAIVED| waived_epic_010["Record incomplete epic outcome<br/>do not claim completion"]
  status_006 -->|No unfinished item, but skip / waiver exists| waived_epic_010
  sub_sign_004 -->|Revise and come back| sub_brainstorm_003
```

**Iron rules**:

- **Each sub-feature's spec must be signed off individually** (Q1-A decision): the master spec sign-off ≠ authorization to auto-generate all sub-specs; each sub-spec draft must run through Steps 2–6, including its own concise summary and approval (starting from Lightweight: the master spec has already set the boundaries, so skip Step 1 clarification)
- The sub-spec's AC is renumbered from `AC-01`, with each entry annotated with its corresponding master AC (e.g. `↑ EPIC AC-02`)
- The sub-feature directory **must be nested** inside `specs/<epic>/`; flattening it into the `specs/` root is forbidden
- Advance only one sub-feature at a time (serially); do not open multiple sub-spec drafts in parallel
- Mark a sub-feature `[√]` only after its own Verify PASS. After every sub-feature is `[√]`, run the epic test.md cross-feature gates; only epic PASS completes the large feature. A skip/waiver remains explicitly incomplete.

---

## Step 1: Clarify intent (one question at a time, multiple-choice preferred)

**Iron rules**:
- Ask only 1 question at a time, **do not flood the screen with 5**
- If you can list options, list options; open-ended questions are only for "add anything else"
- Total rounds ≤ 5 (including follow-ups); exceeding it means the scope isn't aligned → go back to Step 0

**6 candidate questions (pick 0–5 as needed, ask in order)**:

If the request already contains enough information to define testable AC and boundaries, ask none of these questions and proceed directly to Steps 2–5.6, then request approval of the concise scope summary.

1. **Who**: Who are the users?
   - (A) In-project developers (B) End users (C) CI / automation (D) Other, please specify
2. **Why**: What is the biggest pain of not having it now?
   - (A) Inefficient process (B) Error-prone (C) Not traceable (D) Completely impossible (E) Other
3. **Scope (MVP)**: What **must** the first version include?
   - List 2–3 candidate minimal sets for the user to pick
4. **Existing**: Is there already related code / docs in the project? Is this new or a replacement?
   - (A) Brand new (B) Replaces existing `<old module>` (C) Extends on top of `<existing module>`
5. **Constraints**: Are there deadline / performance / compatibility / third-party dependency constraints?
   - Open-ended (this kind of info can't be enumerated as multiple-choice)
6. **Success**: What counts as "done"? Give one quantifiable criterion.
   - Example: (A) First screen < 2s (B) Error rate < 1% (C) Custom metric, please specify

---

## Step 2: Candidate AC (EARS syntax)

**The five EARS templates**:

| Type | Syntax | Example |
| --- | --- | --- |
| Ubiquitous | `The <system> shall <response>` | "The system shall enforce a meta-info block on all spec.md files." |
| Event-driven | `When <trigger>, the <system> shall <response>` | "When the user clicks the commit button, the system shall perform code commit first." |
| State-driven | `While <state>, the <system> shall <response>` | "While in sync-only mode, the system shall not trigger code commit." |
| Optional feature | `Where <feature>, the <system> shall <response>` | "Where verbose mode is enabled, the system shall output the git command details." |
| Unwanted | `If <trigger>, then the <system> shall <response>` | "If `.fibo/index.json` is missing, the system shall fall back to HEAD-only analysis mode." |

**Numbering convention**:
- Full mode: start from `AC-01`
- Lightweight mode: continue from the existing spec's last AC number (e.g. if AC-07 exists, new ones start from AC-08)

**Points to note**:
- Every AC must be testable and rejectable ("user-friendly" ❌ / "first screen < 2s" ✅)
- One AC, one thing; avoid "the system shall do A and do B"
- Exception / error paths must be explicitly listed (`If ... shall`); do not default to "the happy path is enough"
- Every AC must admit a concrete oracle: an observer can tell PASS from FAIL without consulting the implementation. Concrete positive / negative / boundary examples are elaborated in `test.md` by `fibo-testing`, not embedded as implementation details in the spec.

---

## Step 3: Boundaries and Non-goals (make them explicit)

Fill the `Out of Scope / Non-goals` entry under spec.md §2, listing what "is explicitly not being done this time". Example:

```
Non-goals (not this time):
- No support for multi-user concurrent editing (Phase 2)
- No offline mode (relies on the existing online architecture)
- No refactoring of the existing ConfigLoader (only add a layer on the outside)
```

**Why it matters**: to avoid "casual extension" during the later implementation stage that causes the spec ↔ reality to diverge.

---

## Step 4: Resolve trade-off questions in dialogue (**does not enter the spec**)

Settle all questions that "affect AC / design direction" **in this step's dialogue, right when discussed**. You **must not** write an `Open questions` section into the on-disk spec.md (per Core principle #6).

### 4.1 Should you ask? — Decision flow

```mermaid
flowchart TD
  question_001["A question arises"] --> tradeoff_check_002{"Is there a real trade-off among candidates?"}
  tradeoff_check_002 -->|One option is clearly better| autonomous_choice_003["Choose it in the draft<br/>record choice and reason"]
  tradeoff_check_002 -->|Each option affects AC direction| ask_user_004["Ask the user<br/>use the 4.2 format"]
```

### 4.2 Format for asking questions

If you must ask, **provide candidates + a one-sentence trade-off + mark the recommended option**. Don't just list `[ ] Q1: …await user decision`.

```
Q1: How to handle a file conflict?
  (A) Overwrite directly — simple, but risks losing data
  (B) Error out and exit — safe, but poor user experience
  (C) Generate a .conflict copy — recommended: balances safety and recoverability
  → Please choose
```

### 4.3 After discussion

- User decided → in the Step 5 draft, reflect it directly as AC / Non-goals / a design decision, **no longer marked "undecided"**
- User says "leave it for Phase 2" → write it into the Out of Scope / Non-goals entry ("not doing X this time, decide in Phase 2"), likewise **without an Open questions section appearing**
- A genuinely uncertain open point (very rare) → escalate to an ADR (`decisions/`), don't put it in spec.md

---

## Step 5: Prepare the complete spec.md draft (not written to disk)

Organize it per the structure of `references/spec.template.md` (maintained by `fibo-conventions`). Use the following skeleton as the required structure and fill every applicable section. Retain the complete draft for self-review and later persistence; by default, present only the Step 5.6 summary. If the user asks for the full draft, show it before the summary in the same response:

```markdown
# {Feature display name}

## 1. Background and purpose (WHY)
(Overview of Who / Why / value)

## 2. Scope and Non-goals
- In Scope: ...
- Out of Scope / Non-goals: ...

## 3. Acceptance criteria (EARS phrasing + implementation anchors)
### AC-01: ...
WHEN ..., THE SYSTEM SHALL ...
Implementation location: leave empty for reverse sync.

## 4. Related documents
(Use the document-tag structure from spec.template.md.)

## 5. Supplementary design context (optional)
(Canonical HOW goes to design.md; HOW TO PROVE goes to test.md.)

---
name: {Feature display name}

update-time: {take the current system time at sign-off, using the sync.md §2.2 command}

description: {a one-sentence description of this feature's goal and scope, for retrieval}

---
```

---

## Step 5.5: Pre-disk self-review checklist (**mandatory**)

Before presenting the summary or a requested full draft, run through the table below **yourself** first; if any item is abnormal → go back to Step 2 to fix it:

| # | Check item | Failure example |
| --- | --- | --- |
| C1 | All AC use EARS syntax and are numbered | "supports export" ❌ |
| C2 | Every AC is testable, rejectable, free of subjective words | "friendly" / "reasonable" / "fast" ❌ |
| C3 | One AC describes only one thing | "the system shall do A and B" ❌ |
| C4 | Exception / error paths are explicitly listed (at least 1 `If ... shall`) | all happy path ❌ |
| C5 | The Out of Scope / Non-goals entry is non-empty | entry missing ❌ |
| C6 | **No `Open questions` section in the draft** | leaving "## 4. Open questions" ❌ |
| C7 | **No placeholders / TODO / `<to fill>` / `TBD`** in the draft | "AC-03: <todo>" / "TBD" ❌ |
| C8 | AC and Non-goals do not contradict | AC-02 says "supports X" while Non-goals says "won't do X" ❌ |
| C9 | Scope is still within the range agreed in Step 0 (no bloat) | Step 0 said focus on subsystem A, but AC contains B's features ❌ |
| C10 | The meta-info block has all three elements (name / update-time / description placeholder) | missing a field ❌ |

**Passed → proceed to Step 5.6**; **do not** report the passing checklist items back (the user doesn't need to know the self-review process).
**Any failure → silently rework**, running it repeatedly until all pass; don't ask for approval of an unfinished draft or summary.

---

## Step 5.6: Summarize what will and will not be done

After preparing and reviewing the complete draft, write a short, plain-language summary for the user to approve. Aim for 3–6 short bullets total under two labels, localized to the user's language: **What will be done** and **What will not be done**. Describe concrete features and user-visible results; omit AC numbering, EARS phrasing, implementation details, document structure, and the self-review checklist.

The summary must faithfully cover the draft's main capabilities, exclusions, and any constraints or failure behavior that materially affect the user's decision. Group related behavior instead of repeating every AC. Do not introduce promises absent from the draft or hide a material scope decision to save space. Keep the corresponding complete draft available so approval can be followed by writing it to disk.

For a Chinese request, the confirmation can look like this (replace the example with the actual scope):

```text
本次做：
- 支持把任务导出为 CSV，并选择要导出的日期范围。
- 没有可导出任务时，提示用户，不生成空文件。

本次不做：
- 不支持 Excel 格式，也不做定时自动导出。

确认后，我会把对应的完整草案写入 spec，并继续规划、实现和验证。是否通过？
```

If the user requests changes, update the full draft first, rerun self-review, and present an updated summary for approval. A request to see the full draft is not approval; show it followed by the same summary and keep the single approval pending.

---

## Step 6: Wait for sign-off

Ask the user to approve the summary, making clear that approval will write the corresponding complete draft to spec.md and continue planning, implementation, and verification. The user does not need to read or separately approve the full draft.

**Only when the user explicitly says "OK / approved / go" do you proceed to the next step.**
**Do not treat "the user did not object" as "the user agreed".**

After sign-off passes, **auto-chain execution** (no need to ask the user again, no need for the user to manually trigger between stages):
1. Invoke the `fibo-conventions` skill to get the on-disk / meta-info conventions
2. Actually create / update `spec.md` under `.fibo/docs/specs/<feature-slug>/` using the complete draft corresponding to the approved summary, not the summary alone. Set the meta-info block `update-time` to the current system time (for the command, see `fibo-conventions` §"getting system time cross-OS"). Do not add behavior, exclusions, or constraints beyond the approved scope; if a material change is needed, revise the draft and obtain approval of its updated summary first
3. **Immediately invoke the `fibo-writing-plan` skill**: read the just-written spec.md → run `fibo-testing` Shape-A → draft a testable design → run Shape-B → produce design.md + test.md + plan.md
4. **Immediately after the three planning artifacts are written, invoke the `fibo-executing-plan` skill**: implement task by task with the TDD mode declared in test.md / plan.md, then invoke `fibo-testing` Verify for the final gate
5. When execution wraps up, output "implementation complete" only if every task is `[√]` and the final test state is PASS; if any task is `[↷]` or verification is WAIVED, report that execution finished with skips / waiver and list the incomplete impact. Then prompt the user to actively trigger commit-sync (commit-sync is still user-triggered, not run automatically)

> **Do not stop between stages to ask "should we proceed to the next step"** — the user's single sign-off at Step 6 = authorization to run the full spec → design/test/plan → TDD implementation → verification chain. Only stop in the following cases:
> - `fibo-writing-plan` hard self-review fails (AC/TC/task coverage incomplete, out of bounds, or a prod-code task lacks a valid test contract)
> - `fibo-executing-plan` a task still fails after its one automatic repair attempt (offer repair / skip / abort / custom handling and wait for the user's choice)
> - `fibo-testing` final verification fails and the bounded repair still does not pass (offer repair / waiver / abort / custom handling and wait for the user's choice)
> - The user explicitly calls a halt during the chaining

---

## Mandatory constraints

- ❌ Do not `Write` any file under `.fibo/docs/specs/...` before the user signs off
- ❌ Do not write any business code / tests / config at this stage
- ❌ Do not do a git commit at this stage
- ❌ Do not casually ask the user: when a candidate has an obvious winner, decide directly; **only ask when a real trade-off exists**
- ❌ Do not write an `Open questions` section into the on-disk spec.md — all questions are settled in the Step 4 dialogue
- ❌ Do not ask the user to confirm scope / intent / AC / boundaries chunk by chunk — prepare the complete draft and request one sign-off through its concise scope summary
- ❌ Do not ask more than 1 question at a time; do not ask ≥ 5 open-ended questions at once
- ❌ Do not skip the complete draft or Step 5.5 self-review and ask for approval of a summary alone
- ❌ After Step 5.5 passes, **do not** report the passing checklist items to the user (silently let it through)
- ❌ Do not require a second full-draft confirmation after the user approves the summary
- ✅ Allowed: show the full draft as a code block when the user requests it, followed by the concise summary; use `references/spec.template.md` as a skeleton reference
- ✅ Allowed: list options whenever possible; open-ended questions only for "add anything else"

---

## Handoff to `fibo-conventions`

```mermaid
flowchart LR
  new_need_001["User new need / behavior change"] --> brainstorm_002["fibo-brainstorming"]
  brainstorm_002 -->|Scope summary approved| write_spec_003["Write corresponding full spec.md to disk"]
  write_spec_003 -->|Auto| write_plan_004["fibo-writing-plan + fibo-testing Shape<br/>produce design.md + test.md + plan.md"]
  write_plan_004 -->|Auto| execute_plan_005["fibo-executing-plan<br/>TDD task loop + final verification"]
  execute_plan_005 -->|"Tasks and Verify resolved"| commit_prompt_006["Report PASS, skips, or waiver accurately<br/>prompt user to trigger commit-sync"]
```

**Division of labor**:
- `fibo-brainstorming`: **prepare the complete draft + obtain approval through a concise scope summary + write the approved spec** (user-facing deliverable: what will and will not be done; the full draft is shown on request)
- `fibo-testing`: **turn signed AC into the test.md verification contract and run the final gate**
- `fibo-conventions`: **all iron rules after writing to disk** (path tags / comments / five-artifact reverse sync / commit-sync)

Do not mix the stages of the two skills. The "sign-off" action completed by this skill is the prerequisite for `fibo-conventions` to later treat `spec.md` as a "whitelisted sync target".

---
name: Fibo brainstorming pre-stage skill

update-time: 2026-10-26 09:43

description: Prepare a complete behavior spec, obtain approval through a concise scope summary, then persist it and chain planning, implementation, and verification

---
