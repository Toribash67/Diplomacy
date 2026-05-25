# Web Agent Notes

## Scope

This package is a dependency-free browser prototype. Do not add a bundler or production dependency unless the task clearly requires it.

## Validation

- Run `make web` from the repo root when manually checking the browser UI.
- Run `node --check` on every changed JavaScript module in `packages/web/src`.
- Run `git diff --check` before finishing.

## UI Rules

- Keep map visual metadata separate from engine variant data.
- Keep order drafting behavior deterministic and local to the browser prototype.
- Preserve keyboard access for interactive map regions and order controls.
- Prefer small modules by responsibility: map parsing, rendering, order drafting, geometry, and DOM helpers should not collapse back into one large file.

## Map Notes

- `assets/diplomacy.svg` is a local copy of the attributed Wikimedia map.
- Province click geometry and label positions are visual overlay data, not engine rules data.
