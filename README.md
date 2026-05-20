# Diplomacy
My implementation of the diplomacy board game.

## Current Direction

The first milestone is a variant-capable rules engine. The engine treats a Diplomacy board as data supplied by a `VariantDefinition`, so the classic 1901 map can be bundled later without hardcoding map assumptions into adjudication logic.

## Development

```sh
brew install typescript
make test
```
