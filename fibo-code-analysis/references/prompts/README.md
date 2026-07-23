# Full set of prompts (prompts)

> This directory is part of the `fibo-code-analysis` skill and collects all prompts of the analysis pipeline; it is this skill's **source of truth** — independent of any external project, the whole analysis capability can be reproduced from this directory alone.
>
> **Maintenance time**: 2026-06-29 23:07 (already includes the "expert view written only when grounded" and Markdown three-field meta-info block optimizations, see ../template-dsl.md §2.1 / §6)
> **Nature**: this directory is the authoritative copy. After changing any `*.prompt.md` / `*.template.md`, refresh the maintenance time in ../template-dsl.md and in this file in sync.

## File list (19 files)

| File | Stage / purpose | Companion |
| --- | --- | --- |
| `codeAnalysis.prompt.md` | Code-structure full-AI fallback (generic, used when there is no tree-sitter grammar) | — |
| `codeAnalysis.{c,cpp,go,java,javascript,typescript,python,cangjie}.prompt.md` | Language-specific structure analysis (auto-selected by extension, falls back to the generic version if not found) | — |
| `structureDescription.prompt.md` | Adds descriptions to a tree-sitter skeleton (produces `{key:desc}`) | — |
| `fileSummary.prompt.md` | File-summary system instruction | `fileSummary.template.md` |
| `folderSummary.prompt.md` | Directory-summary system instruction | `folderSummary.template.md` |
| `configSummary.prompt.md` | Config-file-summary system instruction | `configSummary.template.md` |
| `folderSubItem.prompt.md` | Compresses a child info.md into a ≤300-char summary (produces `{summary}`) | — |
| `default.prompt.md` | Fallback system prompt (used when neither the functionName nor the generic version is found) | — |

## Selection and fallback logic

See `../pipeline.md` §4 "prompt / template mapping table" and the fallback flowchart. Key point: `codeAnalysis.<lang>` not found → `codeAnalysis.prompt.md` → `default.prompt.md`; to add a language just drop one `codeAnalysis.<lang>.prompt.md` here.

## Template DSL

For the resolution rules of the five symbols `{}` `()` `[]` `{A|B}` `<tag>` inside `*.template.md`, see `../template-dsl.md`. Jump-tag / Mermaid node-ID rules always defer to `fibo-conventions/references/conventions/markdown.md`; the generated Markdown must end with a `name` / `update-time` / `description` meta-info block.

---
name: Full set of prompts (prompts)

update-time: 2026-06-30 04:36

description: The authoritative prompt/template list of the code-analysis skill, describing each stage's prompt, the template companion relationships, and the Markdown three-field meta-info block requirement

---
