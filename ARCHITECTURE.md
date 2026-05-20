# Architecture

## Goal

The long-term goal is an async multiplayer Diplomacy service. The current milestone is a variant-capable rules engine that can power a later web UI and backend service.

The engine should remain pure and data-driven:

```ts
adjudicate(previousState, submittedOrders, variantDefinition) -> adjudicationResult
```

Rules logic belongs in the engine. Map facts belong in variant data.

## Project Shape

```txt
packages/
  engine/
    src/
      adjudicate.ts
      types.ts
      validateVariant.ts
      variantBuilder.ts
      variants/
        classic1901.ts
        testVariant.ts
```

There is no web app yet. The engine is tested with brewed TypeScript and Node's built-in test runner via:

```sh
make test
```

## Engine Model

The board model separates provinces from locations:

- `ProvinceId`: ownership and supply-center identity.
- `LocationId`: occupiable/movable map points, including named coasts.

This matters for provinces such as Spain, Bulgaria, and St Petersburg, where one province has multiple fleet coast locations but only one supply center and one occupying unit at a time.

Adjacency is unit-type aware:

```ts
{
  to: LocationId,
  unitTypes: ["army"] | ["fleet"] | ["army", "fleet"]
}
```

This allows cases like `A APU - ROM` being legal while `F APU - ROM` is illegal.

## Variants

A `VariantDefinition` contains:

- powers
- provinces
- locations
- unit-type-aware adjacency
- initial game state

`validateVariant` checks structural consistency, including:

- duplicate powers, provinces, locations, and units
- broken references
- missing adjacency lists
- non-reciprocal adjacency
- invalid starting unit location/type
- multiple units in one province

`classic1901` is encoded as repo-owned data and validates successfully. It includes:

- 7 powers
- 75 provinces
- 81 locations
- 34 supply centers
- Spring 1901 starting units
- full standard map adjacency

## Current Rules Support

Implemented:

- movement orders
- hold orders
- support orders
- movement validation
- support validation
- support cuts
- dislodgement
- self-dislodgement prevention
- head-to-head movement handling
- movement into vacated provinces
- retreat option generation
- retreat orders
- disband orders
- contested retreats
- phase progression through movement and retreat phases
- fall supply-center ownership updates
- build phase adjudication

Known gaps:

- convoys
- convoy disruption
- convoy paradoxes
- more DATC-style movement edge cases
- game-end detection

## Engine Roadmap

To finish the classic rules engine, work through this order:

1. Fall supply-center ownership - done
   - After Fall movement and any Fall retreats, occupied supply centers change owner.
   - Spring movement and Spring retreats must not change ownership.

2. Build phase - done
   - Compute each power's unit count versus owned supply centers.
   - Support build orders in open owned home centers.
   - Support forced and ordered disbands when a power has too many units.
   - Advance Winter to next Spring movement.
   - Automatic disbands currently use deterministic unit-id order; this is stable but can be replaced by a configurable policy later.

3. Movement correctness hardening
   - Add DATC-style tests for supports, head-to-head moves, beleaguered garrisons, standoffs, and self-dislodgement edge cases.
   - Fix adjudication behavior where those tests expose gaps.

4. Convoys
   - Add convoy order types and validation.
   - Support army movement by convoy.
   - Support convoy disruption.
   - Add convoy paradox handling after the non-paradox convoy cases are stable.

5. Game-end checks
   - Detect 18-center solo victory after supply-center ownership updates.
   - Leave draw voting and concession rules to the later async service layer.

6. API cleanup
   - Add stable machine-readable result codes alongside human-readable reasons.
   - Consider phase-specific result types once movement, retreat, and build adjudication are complete.

## Testing Strategy

Engine behavior is tested with focused unit tests and small artificial variants before using the full classic map. The small `testVariant` keeps adjudication scenarios readable.

Classic 1901 tests cover:

- map counts
- starting setup
- variant validation
- representative legal and illegal movement examples

As the rules grow, we should add DATC-style adjudication fixtures. If the engine is ever ported to Rust for bot/search performance, these fixtures should become cross-language conformance tests.

DATC v3.0 Chapter 6 is now imported into `packages/engine/src/datc/datcCases.ts` as repo-owned fixture data. The current Node test suite registers unmapped cases as TODO conformance tests until the raw DATC order text is mapped to typed engine states, orders, and assertions. Sections 6.A and 6.B are executable against the classic map through the DATC harness. Section 6.C is partially executable; the remaining 6.C cases require convoy support.

## Future Layers

### Web App

The first UI should be a local playable web app that consumes the engine directly:

- render board state
- enter orders
- adjudicate a phase
- show results and explanations
- inspect retreats/builds

### Async Service

The backend should persist game state snapshots and submitted orders, then run the engine as a deterministic phase processor.

Likely service concepts:

- users
- games
- powers/assignments
- deadlines
- submitted orders
- phase history
- press/messages
- game snapshots

### Deployment

Deployment is deferred. The intended NAS path is:

```txt
/mnt/ssd_pool/apps/diplomacy
```

The NAS is reachable as `ssh nas`, and Docker/Compose are available. For TrueNAS UI visibility later, prefer a TrueNAS Custom App or Compose/YAML install rather than an unmanaged manual `docker compose up`.
