# Server Agent Notes

## Scope

This package owns the lightweight development/deployment backend for the web prototype.

## Rules

- Keep the server dependency-free unless the task clearly requires otherwise.
- Keep Diplomacy rule decisions inside `packages/engine`; the server should orchestrate persistence, request parsing, and calls into `adjudicate`.
- The first service slice is a single shared sandbox game without users, authentication, or parallel game sessions.

## Validation

- Run `node --check packages/server/src/server.mjs` after server changes.
- Run `git diff --check` before finishing.
