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
  web/
    index.html
    src/
      main.js
      arrows.js
      dom.js
      mapData.js
      mapGeometry.js
      orderOptions.js
      paneResizer.js
      styles.css
      unitShape.js
```

The engine is tested with brewed TypeScript and Node's built-in test runner via:

```sh
make test
```

The browser prototype is served without package dependencies via:

```sh
make web
```

The web package is intentionally split into small dependency-free modules. `main.js` owns bootstrapping, state, and high-level rendering flow. Focused modules own reusable DOM helpers, SVG unit shapes, map SVG parsing, pane resizing, arrow geometry, and order-option calculations.

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
- convoy orders
- movement validation
- support validation
- convoy validation
- support cuts
- dislodgement
- self-dislodgement prevention
- head-to-head movement handling
- movement into vacated provinces
- army movement by convoy
- convoy disruption
- adjacent-province convoy intent
- Szykman-style convoy paradox handling
- retreat option generation
- retreat orders
- disband orders
- contested retreats
- phase progression through movement and retreat phases
- fall supply-center ownership updates
- build phase adjudication
- civil disorder disband selection

Known gaps:

- game-end detection
- machine-readable result codes
- service-level concepts such as deadlines, press, draws, and persistence

## Engine Findings

The engine is now far enough along that several design constraints are worth preserving.

### Pure Adjudication Boundary

`adjudicate(previousState, submittedOrders, variantDefinition)` remains the right boundary. It keeps adjudication deterministic and easy to test: the caller supplies a complete phase state, raw submitted orders, and a map definition; the engine returns the next state, per-order results, dislodgements, retreats, and invalid orders.

The function is intentionally phase-aware rather than split into separate public entry points. Movement, retreat, and build adjudication share the same state/result vocabulary, while invalid phase-specific orders are still reported as order results instead of throwing.

### Province Versus Location Is Essential

The province/location split is not just a map-modeling detail. It drives core rules:

- one unit occupies a province even when a province has multiple coast locations
- attacks against different coasts of the same province still contest the same province
- fleet movement and support can depend on the current coast
- armies can target the land location of a multi-coast province without caring about coast
- retreat and build availability are province-based, not location-count-based

Do not collapse these concepts unless the replacement can still represent Spain, Bulgaria, and St Petersburg correctly.

### Movement Resolution Is Iterative

Movement adjudication has dependencies that cannot be handled by a single linear pass. The current resolver computes active moves, support cuts, attack strengths, dislodgements, convoy disruptions, and dislodged supports, then recalculates when later facts change earlier assumptions.

Important dependency loops include:

- a convoyed army may cut support that would otherwise dislodge a convoying fleet
- a dislodged convoying fleet can make the army's move inactive
- a dislodged supporter loses its support
- a move that becomes inactive must stop cutting support or contesting its destination
- self-dislodgement checks depend on the final dislodgement strength, not just nominal attack strength

This is why the engine tracks active move orders separately from submitted move orders.

### Convoy Semantics

Convoys are represented explicitly with `ConvoyOrder`, and army moves can opt into `viaConvoy`. A move can be treated as convoyed when:

- the order says `viaConvoy`
- the destination is non-adjacent and a route exists
- an adjacent move has convoy intent from at least one convoying fleet of the moving power

Foreign fleets can provide convoy routes, but they cannot by themselves express adjacent-convoy intent. This prevents "kidnapping" an adjacent army onto a convoy route the army's owner did not indicate.

The engine deliberately does not fall back to land movement when a move explicitly intended to use convoy and the convoy fails. That behavior matches the DATC preferences used by the test suite.

For adjacent convoy attacks, the attack is not treated as a normal head-to-head land battle. This matters for swaps, support cuts, dislodgement, and retreat options. When an adjacent convoyed attack dislodges a unit, the defender may retreat to the convoyed army's original province under the 2023 rule preference covered by DATC.

### Convoy Paradoxes

The engine follows the Szykman-style preference encoded in the DATC expectations:

- support is not cut when cutting it would create the dependency that saves or destroys a necessary convoying fleet
- the paradoxical convoying army fails rather than being allowed to both depend on and invalidate its own route
- multi-route convoys only become paradoxical when the attacked convoying fleet is necessary to the route
- second-order convoy paradoxes are handled by detecting dependency cores across convoyed moves and supports

This logic is intentionally conservative. If a convoy has another surviving route, support can still be cut normally.

### Supports And Self-Dislodgement

Attack strength and dislodgement strength are related but not identical. Support from the defender's own power can help an attack contest a province, but it cannot be used to dislodge that defender. The engine records support counts by power so it can subtract defender-owned support when checking whether dislodgement is legal.

This distinction is required for DATC self-dislodgement and beleaguered-garrison cases.

### Retreats

Retreat options are generated from the board after movement. A retreat option is unavailable when:

- the destination province is occupied after movement
- the destination province was the attack origin
- the destination province was a standoff
- another retreat resolves to the same province

The attack origin exception is adjusted for adjacent convoyed attacks: the convoyed army's land origin is not treated as the direct attack origin for retreat exclusion.

### Builds And Civil Disorder

Build adjudication compares owned supply centers to unit count in Winter. Builds are legal only in open owned home centers, and a province with any occupied coast is occupied for build purposes.

When a power fails to submit enough disbands, civil disorder removes units deterministically:

- greatest distance from any owned supply center first
- fleets before armies when distance ties
- province name alphabetically when type and distance tie
- unit id as the final deterministic tie-breaker

Distance is measured on a province graph derived from all map adjacencies, ignoring unit type, matching DATC civil disorder expectations.

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
   - Automatic disbands use DATC civil disorder distance ordering.

3. Movement correctness hardening - done
   - Add DATC-style tests for supports, head-to-head moves, beleaguered garrisons, standoffs, and self-dislodgement edge cases.
   - Fix adjudication behavior where those tests expose gaps.

4. Convoys - done
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

DATC v3.0 Chapter 6 is imported into `packages/engine/src/datc/datcCases.ts` as repo-owned fixture data. All Chapter 6 cases are now executable against the classic map through the DATC harness, with `0` TODO conformance cases. The DATC harness maps raw DATC order text into typed engine units and orders, including shorthand support/convoy notation and common DATC spelling quirks.

The DATC suite is the main conformance safety net for movement, convoy, retreat, build, and civil disorder behavior. If the engine is ever ported to Rust for bot/search performance, these fixtures should become cross-language conformance tests.

## Future Layers

### Web App

The first UI should be a local playable web app that consumes the engine directly:

- render board state
- enter orders
- adjudicate a phase
- show results and explanations
- inspect retreats/builds

The current web prototype can also be built as a static container. The Docker image compiles the engine in a Node build stage, then serves `packages/web` and the compiled engine modules from nginx.

### Frontend And Map Roadmap

The rules engine is now stable enough to start a local frontend. The next milestone should be a playable classic-map prototype, not a backend service.

Status: a first dependency-free browser prototype exists in `packages/web`. It renders the Classic 1901 initial board from `classic1901.initialState`, uses separate render metadata in `mapData.js`, and can show province details, starting units, supply ownership, and an adjacency overlay.
Order entry currently covers movement, support, convoy, retreat, disband, and winter build phases.

Recommended order:

1. Create a frontend package
   - Done as `packages/web`, beside `packages/engine`.
   - It consumes the built engine modules directly.
   - It starts with a local development server and no persistence.

2. Add a classic map render layer
   - Started with coordinate metadata keyed by `ProvinceId`.
   - Use `classic1901` provinces, locations, and initial state as the rules source of truth.
   - Keep render metadata separate from rules data.
   - Replace the node-map prototype with SVG path geometry, label positions, unit positions, and coast anchors keyed by `ProvinceId` and `LocationId`.
   - Prefer an SVG board first because clickable provinces, overlays, labels, and unit markers are straightforward.

3. Render board state
   - Show province ownership.
   - Show current units at stable unit anchor points.
   - Distinguish armies, fleets, and fleet coasts.
   - Add enough visual state for selected units, legal-looking destinations, contested areas, and dislodged units.

4. Build order entry
   - Done for hold, move, support, convoy, retreat, disband, and build orders.
   - Keep the engine authoritative; frontend validation should help the user but not replace adjudication.

5. Wire phase adjudication
   - Keep a local in-memory `GameState`.
   - Submit typed orders into `adjudicate`.
   - Display per-order result status and reason.
   - Advance into retreat/build phases when the returned state requires it.

6. Add local game ergonomics
   - Order list editing and deletion.
   - Clear phase/result panels.
   - Board overlays for successful moves, failed moves, dislodgements, retreats, and builds.
   - Optional import/export of a JSON game snapshot before building a real backend.

7. Defer backend work
   - Do not introduce users, deadlines, press, draw votes, or persistence until the local UI can play through phases.
   - Once the local UI is usable, the async service can persist snapshots and submitted orders around the same pure engine boundary.

### NAS Deployment

The initial deployment target is a static web container managed by Dockge:

- `Dockerfile` builds the engine and packages the web prototype into nginx.
- `.github/workflows/web-container.yml` publishes `ghcr.io/toribash67/diplomacy-web:latest` on pushes to `main`.
- `deploy/dockge/compose.yml` is the stack file to paste or import into Dockge.

The compose file maps NAS port `18080` to container port `80`. Change the left-hand port if `18080` is already used on the NAS.

For hands-off updates after each push, run the Watchtower stack in `deploy/watchtower/compose.yml`. It uses `--label-enable`, checks every minute, and the Diplomacy container opts in with `com.centurylinklabs.watchtower.enable=true`, so unrelated NAS containers are left alone.

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
