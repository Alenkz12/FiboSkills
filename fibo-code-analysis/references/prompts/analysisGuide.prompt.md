# Beginner-oriented analysis writing rules

## Runtime context

- Unit type: `{{UNIT_TYPE}}`
- Primary role: `{{PRIMARY_ROLE}}`
- Secondary roles: `{{SECONDARY_ROLES}}`
- Output language: `{{OUTPUT_LANGUAGE}}`

Write every reader-facing label in {{OUTPUT_LANGUAGE}}. This includes the article title, section headings, prose, diagram title, node labels, edge labels, hints, and the short explanation around a diagram. Keep protocol words required by navigation markup, real paths, code identifiers, and metadata field names unchanged.

Write for someone opening the project for the first time. Begin with what the current file or directory helps them understand or do. Prefer visible purpose, responsibilities, important entry points, inputs, and results over implementation trivia.

The unit type and article layout are fixed by the host analysis object, not selected by the model or inferred from a role. Choose only the primary and useful supplementary roles when calling analysisReadTemplate. The selected unit layout is the public article skeleton. The primary role template is the main reading lens. Supplementary role templates may add useful details, but they must not duplicate the article title, opening summary, diagram, or whole layout. Merge role-specific content into the closest useful section and omit it when the source does not support it.

## Template syntax

Interpret the selected `.template.md` resources yourself. The host does not compile them.

- `{Required reader content}` is required. Replace the entire marker with verified, reader-facing content.
- An `(Agent-only instruction)` on its own line tells you how to fill nearby content. Never copy that line into the article.
- `[Optional reader content]` is optional. Keep and fill it only when evidence makes it useful; otherwise remove the entire block. Square brackets may surround a multi-line optional block.
- `{First choice|Second choice}` is a choice. Keep only the result that fits the current unit, translated when reader-facing.
- `<tag value="code" />`, `<tag value="text" />`, and `<tag value="graph" />` request a final navigation tag. Replace the placeholder with final HTML or graph markup using the navigation examples.
- A name in double braces using `UPPER_CASE_NAME` is reserved for host variables and has already been replaced before you read the template.

Return only the finished Markdown article. Remove every template marker and Agent-only instruction. Do not copy resource headings such as “Selected unit layout”, “Primary role template”, or maintenance metadata after a resource's final `---` separator unless the selected article layout explicitly asks for equivalent reader-facing content.

## Reader-facing scope

Use 2–4 sentences for an opening summary. When the layout asks for capabilities, choose 3–6 main capabilities. When it asks for key code, include no more than 8 key functions or classes. Describe Main inputs and results from the reader's point of view.

Do not add a standalone evidence chain, deep dive, design trade-offs, failure-path inventory, potential-issues list, test-gap list, refactoring advice, or unconfirmed-items section by default. Do not narrate exact regular expressions, internal constants, helper implementations, low-level library calls, line-by-line control flow, or internal exception mechanics unless they directly change visible behavior, accepted input, or produced results.

For a whole-unit diagram, use 3–8 functional nodes and show the main trigger, meaningful processing, and observable result rather than a complete call graph. Place it immediately after the opening summary when requested by the layout, then add a 1–3 sentence explanation. Localize the diagram title, node labels, edge labels, hints, and explanation.

Use source and child-info tools freely when they help establish the article. Never invent a command, dependency, port, setting, role, or behavior. State the limit plainly when the available project evidence cannot verify something the layout requests.

---
name: Beginner-oriented analysis writing rules

update-time: 2026-10-20 18:06

description: Common language, scope, and finite template-syntax rules for direct Agent-authored codebase guides.

---
