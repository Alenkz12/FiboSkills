# {TODO title}

> For operating guidance (when to create, state transitions, naming, renaming to `--done` on completion, boundaries with spec/ADR/report) see `references/conventions/docs-system.md` §3 backlog section; this template only keeps the skeleton to fill in.

- **Status**: `pending` | `implementing` | `done` | `won't-do`
- **Created**: {YYYY-MM-DD}
- **Done**: {YYYY-MM-DD or leave blank}
- **Priority**: `high` | `medium` | `low`

## 1. TODO value (WHY WORTH DOING)

{what value getting this done brings: which pain point it solves / which capability it unlocks / what implicit cost keeps being paid if not done. Write the "worth it" reasoning clearly, so a future review can judge whether it should still be kept.}

## 2. Why it was not done then (WHY DEFERRED)

{the real reason for deferring right now, be specific — pick one or both:}

- **Prerequisites insufficient**: {missing dependency / missing data / missing upstream capability / technology not ready / missing manpower, etc.; state exactly what is missing}
- **Trade-off**: {what higher-priority thing exists now; why the return on investment is temporarily not worth it; what risk makes it unsuitable for now}

## 3. Prerequisites (PREREQUISITES / when it can be picked up)

- [ ] {prerequisite 1: decidable, e.g. "the Y interface of the X module is live"}
- [ ] {prerequisite 2}
- [ ] {prerequisite 3}

## 4. Related anchors (the feature / docs / code involved)

**Related feature directory / docs**:

<div style="display: flex; align-items: flex-end;">
    <span style="background-color: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#.fibo/docs/specs/<feature>/spec.md?class=text" style="color: inherit; text-decoration: none;">
            Document: .fibo/docs/specs/<feature>/spec.md
        </a>
    </span>
</div>

**Related code locations** (code anchors currently affected / to be changed in the future, for reference only, the actual code is authoritative):

<div style="display: flex; align-items: flex-end;">
    <span style="background-color: var(--tag-code-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-code-border); color: var(--tag-code-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#src/services/Foo.ts:120-155?class=code" style="color: inherit; text-decoration: none;">
            Code: src/services/Foo.ts:120-155
        </a>
    </span>
</div>

## 5. Completion backfill (COMPLETION — fill in only when renaming the file to `--done`)

- **Landing feature**: {the feature directory implementing this TODO, use the document tag below to point to its `spec.md` / `diff.md`}
- **Implementation summary**: {one sentence on how it was finally done}
- **Difference from the original conception**: {how the prerequisites were actually met; whether the approach adjusted relative to §1/§3; if finally decided not to do, change to `won't-do` and explain the reason}

<div style="display: flex; align-items: flex-end;">
    <span style="background-color: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#.fibo/docs/specs/<feature>/diff.md?class=text" style="color: inherit; text-decoration: none;">
            Document: .fibo/docs/specs/<feature>/diff.md
        </a>
    </span>
</div>

---
name: {TODO title}

update-time: 2026-07-09 19:31

description: {a one-sentence description of this TODO's value and deferral reason, for retrieval}

---
