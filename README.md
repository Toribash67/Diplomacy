# Diplomacy
My implementation of the diplomacy board game.

## Current Direction

The first milestone is a variant-capable rules engine. The engine treats a Diplomacy board as data supplied by a `VariantDefinition`, so the classic 1901 map can be bundled later without hardcoding map assumptions into adjudication logic.

## Development

```sh
brew install typescript
make test
```

Run the browser prototype with:

```sh
make web
```

Then open `http://localhost:5173/packages/web/`.

## Container

Build the web container locally with:

```sh
docker build -t diplomacy-web .
docker run --rm -p 18080:80 diplomacy-web
```

Then open `http://localhost:18080/`.

The Dockge compose file lives at `deploy/dockge/compose.yml` and uses the GHCR image published by the `Web Container` GitHub Actions workflow.

For continuous NAS updates, run the Watchtower stack in `deploy/watchtower/compose.yml`. The Diplomacy container is opted in with a Watchtower label, and Watchtower is configured to ignore unlabeled containers.
