# {module/feature name} design doc

> **Purpose**: describe "how to do it" — goals, key decisions, file list, interface contracts, testability, and interaction with existing modules. It is the HOW layer between spec.md's WHAT/WHY and test.md's HOW TO PROVE.
> **Location**:
> - Single-feature internal design → `.fibo/docs/specs/<feature>/design.md` (or `design/<topic>.md` when complex)
> - Cross-feature global design → `.fibo/docs/architecture/<topic>.md`
>
> **Mandatory constraint**: in Section 2 "Key design decisions", **each decision** must be tagged at the end with `↔ AC-NN` (one or more, corresponding to the AC number in spec.md), realizing bidirectional design ↔ AC traceability. A decision paragraph with no AC attached is not allowed to be written.

## 1. Goal

A paragraph summarizing which AC in spec.md this design implements, which testable public behavior and seams it must enable for test.md, why this design is needed, and this round's boundaries.

## 2. Key design decisions

### D1: {decision one-line title}

{decision explanation: why chosen this way, which alternatives were eliminated, key constraints, and how the decision remains observable/testable. May contain a Mermaid flowchart.}

```mermaid
flowchart LR
  module_a_001["Module A"] --> module_b_002["Module B"]
  module_b_002 --> module_c_003["Module C"]
```

↔ AC-XX, AC-YY

### D2: {decision one-line title}

{...}

↔ AC-ZZ

> 💡 A major decision (affecting multiple features / changing the core architecture) should get its own ADR; this section only summarizes and links to it.

## 3. File list

**New**:

| Path | Purpose | Corresponding AC |
| --- | --- | --- |
| `path/to/new-file.md` | ... | AC-XX |

Test files used by test.md must appear in New or Modified when this feature creates or changes them. For each new test source, state its owning production `src/...` path in Purpose and derive the file under the sibling `test/` tree by preserving the directory below `src/` (`src/a/c` → `test/a/c`); the filename suffix follows the repository's test runner. New shared fixture/helper entries stay under `test/` and state why no one-to-one source mapping exists.

**Modified**:

| Path | Change | Corresponding AC |
| --- | --- | --- |
| `path/to/existing-file.md` | ... | AC-YY |

**Unchanged**: `path/a`, `path/b` (state why explicitly unchanged, to avoid accidental edits).

> 📌 This section is the basis for the commit-sync `design.md consistency check`: the paths declared "new/modified" in this section undergo a file-existence check at the commit-sync stage; missing means reporting `design.md: Updated (removed X)`.

## 4. Interface contracts

The inter-skill / inter-module communication methods. Can use a Mermaid call graph + table.

```mermaid
flowchart LR
  user_001["User"] -->|call| module_a_002["Module A"]
  module_a_002 -->|read/write| file_system_003["File system"]
  module_a_002 -->|output| user_001
```

### 4.1 {Module A} interface

| Item | Content |
| --- | --- |
| Input | ... |
| Output | ... |
| Preconditions | ... |
| Failure modes | ... |

### 4.2 Data format (optional)

```markdown
{field format example}
```

### 4.3 Testability contract

| Concern | Design provision | Related AC / TC |
| --- | --- | --- |
| Public behavior seam | {API/module boundary tested without UI when possible} | AC-XX / TC-01 |
| Determinism | {time/randomness/concurrency/network control} | AC-YY / TC-02 |
| Observability | {return value/state/event/log/metric used as an oracle} | AC-ZZ / TC-03 |
| Dependency isolation | {real/fake/stub boundary and why} | AC-XX / TC-01 |

## 5. Interaction with existing modules

| Existing module | Interaction | Impact |
| --- | --- | --- |
| `module-x` | ... | unchanged / add N lines / modified |

## 6. Related

<div style="display: flex; align-items: flex-end;">
    <span style="background: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#.fibo/docs/specs/<feature>/spec.md?class=text" style="color: inherit; text-decoration: none;">
            Document: .fibo/docs/specs/<feature>/spec.md
        </a>
    </span>
</div>

<div style="display: flex; align-items: flex-end;">
    <span style="background: var(--tag-text-bg); margin: 8px 0 8px 14px; padding: 6px 12px; border-radius: 4px; border-left: 4px solid var(--tag-text-border); color: var(--tag-text-fg); font-size: 14px; font-weight: 500;">
        <a target="_self" href="#.fibo/docs/specs/<feature>/test.md?class=text" style="color: inherit; text-decoration: none;">
            Document: .fibo/docs/specs/<feature>/test.md
        </a>
    </span>
</div>

---
name: {module/feature name} design doc

update-time: {YYYY-MM-DD HH:mm}

description: {a one-sentence description of this design's core decisions, testability provisions, and scope, for retrieval}

---
