# {feature name} feature spec

> **Purpose**: a single feature's "what to do + why + acceptance criteria + implementation anchors", the source of the spec ↔ code bidirectional tracking.
> **Location**: `.fibo/docs/specs/<feature-name>/spec.md`

## 1. Background and purpose (WHY)

{why this feature is needed; what problem it solves; what the cost of not doing it is}

## 2. Scope

- **In Scope (do)**:
  - ...
- **Out of Scope (do not)**:
  - ... (if linked to the Non-Goals of `constitution.md`, note it)

## 3. Acceptance criteria (EARS phrasing + implementation anchors)

> The five EARS phrasings:
> - `WHEN <trigger>, THE SYSTEM SHALL <response>` (event-driven)
> - `WHILE <state>, THE SYSTEM SHALL <response>` (continuous state)
> - `IF <condition>, THEN THE SYSTEM SHALL <response>` (conditional branch)
> - `WHERE <feature flag/context>, THE SYSTEM SHALL <response>` (scenario-scoped)
> - `THE SYSTEM SHALL <response>` (unconditional rule)

### AC-1: {one-line summary}

WHEN {trigger}, THE SYSTEM SHALL {expected behavior}.

**Implementation location** (for reference only, on finding an inconsistency, code wins and this anchor is reverse-updated):

<div style="display: flex; align-items: flex-end;">
    <span style="background: var(--tag-code-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-code-border); color: var(--tag-code-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#src/services/Foo.ts:120-155?class=code" style="color: inherit; text-decoration: none;">
            Code: src/services/Foo.ts:120-155
        </a>
    </span>
</div>

### AC-2: {next one}

...

## 4. Related documents

<div style="display: flex; align-items: flex-end;">
    <span style="background: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#.fibo/docs/architecture/xxx.md?class=text" style="color: inherit; text-decoration: none;">
            Document: .fibo/docs/architecture/xxx.md
        </a>
    </span>
</div>

## 5. Design details (optional)

Simple features write this section directly; complex features split into the `design/` subdirectory and list only the file entry links here.

---
name: {feature name} feature spec

update-time: {YYYY-MM-DD HH:mm}

description: {a one-sentence description of this feature's goal and scope, for retrieval}

---
