# {Feature display name} Implementation plan

> **Purpose**: translate the AC in spec.md into an executable task list, consumed by `fibo-executing-plan`.
> **Location**: `.fibo/docs/specs/<feature-slug>/plan.md`

## 1. AC coverage self-review before writing to disk

| AC | Covering task |
| --- | --- |
| AC-XX | task-NN |
| AC-YY | task-MM |

- ✓ AC coverage NN / NN = 100%
- ✓ All AC referenced by tasks are within the spec, with no out-of-bounds references
- ℹ Tasks marked "integrative" do not participate in the judgment (involved-AC field is `-`)

## 2. Task list

### task-{NN}: {one-line title}

- **Description**: {what to do / why}
- **Involved AC**: AC-XX, AC-YY  (integrative tasks may fill in `-`)
- **Involved files**:
  - `path/to/file` (exact)
  - `path/glob/*.ts` (glob)
- **Acceptance method**: run `ls -la <path>` should produce output / run `grep "x" <path>` should be non-empty
- **Tags**: skill-doc | prod-code | config | ...
- **Status**: [×] not done / [√] done / [!] failed

### task-{NN+1}: {...}

- ...

## 3. Execution order

Execute in the order task-01 → task-NN. Explain inter-task dependencies (if any).

Total task count = N (dispatch subagents when ≥ 5; execute in the main context when < 5).

## 4. Failure handling

On any task failure → mark `[!] failed` + pause + give the user 3 options: (a) skip, (b) abort, or (c) retry after fixing. No auto-rollback.

---

name: {Feature display name} Implementation plan

update-time: {YYYY-MM-DD HH:mm}

description: {a one-sentence description of the AC, task scope, and execution boundary this implementation plan covers, for retrieval}

---
