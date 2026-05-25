# Agent Workflows

## Engine Rule Change

1. Read `packages/engine/AGENTS.md`.
2. Add or update focused tests for the rule behavior.
3. Keep map-specific facts in variant data.
4. Run `make test`.

## Web UI Change

1. Read `packages/web/AGENTS.md`.
2. Keep rendering, map geometry, order drafting, and DOM helpers in focused modules.
3. Run `node --check` on changed JavaScript modules.
4. Run `make web` when a browser check is useful.

## Review Pass

1. Run `git diff --check`.
2. Check that generated files or build output were not accidentally committed.
3. Prefer small, behavior-focused commits.
