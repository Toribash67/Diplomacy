# Agent Notes

This repo currently focuses on a pure, variant-capable Diplomacy rules engine.

## Project Shape

- `packages/engine`: TypeScript rules engine and DATC-style tests.
- `packages/web`: dependency-free browser prototype served from the repo root.
- `deploy`: container deployment notes and compose files.

## Commands

- Run the full validation suite with `make test`.
- The engine uses TypeScript and Node's built-in test runner.
- Use `make typecheck` for a faster engine-only type pass.
- For web changes, run `node --check packages/web/src/main.js` and any changed web modules.
- Run `git diff --check` before finishing changes.
- Run the browser prototype with `make web`, then open `http://localhost:5173/packages/web/`.

## Engine Rules

- Keep adjudication pure: `adjudicate(previousState, submittedOrders, variantDefinition)` should not depend on external state.
- Keep map facts in `VariantDefinition` data, not in generic rules logic.
- Preserve the province/location split. Provinces model ownership and one-unit occupancy; locations model occupiable points, including named coasts.
- Treat DATC Chapter 6 as the conformance source for classic Diplomacy adjudication behavior.

## Editing Guidance

- Prefer narrow changes that preserve the existing data-driven model.
- Add tests with engine changes, especially for movement, convoy, retreat, build, and civil disorder behavior.
- Avoid replacing DATC fixture expectations with easier engine behavior; fix the adjudicator or harness when a mapped DATC case fails.
- Keep durable agent guidance concise. Put package-specific rules in nested `AGENTS.md` files and workflow checklists in docs.
