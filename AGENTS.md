# Agent Notes

This repo currently focuses on a pure, variant-capable Diplomacy rules engine.

## Commands

- Run the full validation suite with `make test`.
- The engine uses TypeScript and Node's built-in test runner.

## Engine Rules

- Keep adjudication pure: `adjudicate(previousState, submittedOrders, variantDefinition)` should not depend on external state.
- Keep map facts in `VariantDefinition` data, not in generic rules logic.
- Preserve the province/location split. Provinces model ownership and one-unit occupancy; locations model occupiable points, including named coasts.
- Treat DATC Chapter 6 as the conformance source for classic Diplomacy adjudication behavior.

## Editing Guidance

- Prefer narrow changes that preserve the existing data-driven model.
- Add tests with engine changes, especially for movement, convoy, retreat, build, and civil disorder behavior.
- Avoid replacing DATC fixture expectations with easier engine behavior; fix the adjudicator or harness when a mapped DATC case fails.
