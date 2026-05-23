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
- use a local copy of the Wikimedia Commons standard Diplomacy SVG map
- keep visual map metadata separate from variant rules data
- inspect provinces, supply ownership, locations, and starting units
- render split-coast fleets at location-specific anchors
- submit hold, adjacent move, support, and convoy orders for all powers
- submit retreat, disband, and build orders through engine phase progression
- preview draft move, support, and convoy orders with map arrows

Map attribution: `assets/diplomacy.svg` is based on [Diplomacy.svg](https://commons.wikimedia.org/wiki/File:Diplomacy.svg) by Martin Asal and contributors, licensed under CC BY-SA 3.0 and GFDL.

Next useful slices:

- replace overlay click targets with province SVG paths
- render adjudication bounces, dislodgements, and ownership changes
