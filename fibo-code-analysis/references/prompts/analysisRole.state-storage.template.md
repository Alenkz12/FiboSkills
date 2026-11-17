# Role template: state-storage

(Use this lens when the unit saves, loads, caches, or manages durable state. Keep query and serialization mechanics out unless they define use.)

## {Localized heading: Stored state lifecycle}

- {Localized label: Stores}: {What state is retained and why.}
- {Localized label: Read path}: {When and for whom it is loaded.}
- {Localized label: Write path}: {What causes it to change.}
- {Localized label: Visible result}: {What persistence enables for a user or the rest of the project.}

[### {Localized heading: Important persistence behavior}

{Consistency, migration, retention, or cache behavior only when verified and consequential.}
]

---
name: State storage role Template

update-time: 2026-10-18 19:11

description: Optional reader-facing fragment for persistence and stored state.

---
