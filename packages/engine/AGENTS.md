# Engine Agent Notes

## Scope

This package owns the pure Diplomacy rules engine. Keep UI, persistence, network, deadline, press, draw, and account concepts out of this package.

## Validation

- Run `make test` from the repo root after engine changes.
- Use `make typecheck` for a faster type-only pass while iterating.
- Add or update tests with behavior changes. Prefer focused tests on small variants before broad classic-map cases.

## Rules

- Preserve the public adjudication boundary: `adjudicate(previousState, submittedOrders, variantDefinition)`.
- Keep map facts in `VariantDefinition`; generic adjudication code should not special-case Classic 1901 provinces.
- Preserve the province/location split. Provinces model ownership and one-unit occupancy; locations model occupiable points including named coasts.
- Treat DATC Chapter 6 expectations as the source of truth for classic movement, convoy, retreat, build, and civil disorder behavior.

## Structure

- Keep `adjudicate.ts` as the public orchestrator when splitting internals.
- Put phase/domain-specific helpers under `src/adjudication/` if they grow large enough to extract.
- Keep fixture data searchable and isolated; large DATC case files are acceptable when they remain data-oriented.
