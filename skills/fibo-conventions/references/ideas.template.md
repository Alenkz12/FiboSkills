# {idea title}

> For operating guidance (when to create, persist only when the user explicitly asks, the clarification loop, the feasibility assessment must read code, state transitions, naming, renaming to `--done` on completion, boundaries with backlog/spec) see `references/conventions/docs-system.md` §3 ideas section; this template only keeps the skeleton to fill in.

- **Status**: `clarifying` | `clarified` | `implementing` | `done` | `won't-do`
- **Created**: {YYYY-MM-DD}
- **Done**: {YYYY-MM-DD or leave blank}

## 1. Scenario description (SCENARIO / where the idea came from)

{describe the real scenario and pain point that triggered this idea.}

## 2. The idea (THE IDEA / a self-consistent full statement)

{fully state the effect this idea aims to achieve.}

**Non-goals**:

- {draw the boundary, to keep the idea from ballooning indefinitely}

## 3. Feasibility assessment (FEASIBILITY / conclusion after reading code)

- **Current state**: {how the related capability is currently implemented / whether there is a reusable base}
- **Change surface**: {which modules to touch / roughly how large the scope}
- **Technical risks and unknowns**: {possible pitfalls, dependencies, performance / compatibility hazards}
- **Conclusion**: `feasible` | `conditionally feasible` | `not feasible for now` — {one sentence on the basis; if "conditionally feasible", what the condition is}

## 4. Clarification log & open questions (CLARIFICATION LOG)

**Clarified**:

- {question → user's reply → impact on §1/§2}

**Open questions (pending user confirmation)**:

- [ ] {an undecided point, needs further questioning of the user}

## 5. Related anchors (the feature / docs / code involved)

**Related feature directory / docs**:

<div style="display: flex; align-items: flex-end;">
    <span style="background-color: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#.fibo/docs/specs/<feature>/spec.md?class=text" style="color: inherit; text-decoration: none;">
            Document: .fibo/docs/specs/<feature>/spec.md
        </a>
    </span>
</div>

**Related code locations** (code anchors read during the feasibility assessment, to be changed in the future, for reference only, the actual code is authoritative):

<div style="display: flex; align-items: flex-end;">
    <span style="background-color: var(--tag-code-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-code-border); color: var(--tag-code-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#src/services/Foo.ts:120-155?class=code" style="color: inherit; text-decoration: none;">
            Code: src/services/Foo.ts:120-155
        </a>
    </span>
</div>

## 6. Completion backfill (COMPLETION — fill in only when renaming the file to `--done`)

- **Related landing feature**: {the feature directory implementing this idea, use the document tag below to point to its `spec.md` / `diff.md`}
- **Implementation summary**: {one sentence on how it was finally done}
- **Difference from the original idea**: {whether the approach adjusted relative to §2; if finally decided not to do, change to `won't-do`, filename without `--done`, and explain the reason}

<div style="display: flex; align-items: flex-end;">
    <span style="background-color: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#.fibo/docs/specs/<feature>/spec.md?class=text" style="color: inherit; text-decoration: none;">
            Document: .fibo/docs/specs/<feature>/spec.md
        </a>
    </span>
</div>

---
name: {idea title}

update-time: 2026-07-09 19:31

description: {a one-sentence description of this idea's scenario and goal, for retrieval}

---
