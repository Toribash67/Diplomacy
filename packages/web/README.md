# Web Prototype

This package is a dependency-free browser prototype for the Diplomacy UI.

Run it from the repo root:

```sh
make web
```

Then open:

```txt
http://localhost:5173/packages/web/
```

The app imports the built engine from `packages/engine/dist`, so `make web` runs the engine build before starting the static server.

Current scope:

- render the Classic 1901 starting board from engine data
- keep visual map metadata separate from variant rules data
- inspect provinces, supply ownership, locations, and starting units
- toggle a province-level adjacency overlay

Next useful slices:

- replace coordinate nodes with proper SVG territory paths
- add order-entry controls for the selected unit
- submit movement orders to `adjudicate`
- render adjudication results, retreats, and phase changes
