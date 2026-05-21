# Dockge Deployment

Use `compose.yml` as a Dockge stack.

The stack runs:

```txt
ghcr.io/toribash67/diplomacy-web:latest
```

and exposes it on NAS port `18080`.

After the stack is running, open:

```txt
http://<nas-hostname-or-ip>:18080/
```

The image serves the app at `/`. The legacy path `/packages/web/` is also present for compatibility with the local static-server prototype.

## First Setup

1. Push the repository to GitHub.
2. Let the `Web Container` workflow publish the image to GHCR.
3. If the package is private, run `docker login ghcr.io` on the NAS with a GitHub token that can read packages.
4. In Dockge, create a stack from this compose file.
5. Change the left side of `18080:80` if port `18080` is already used.

## Continuous Updates

Dockge will keep the container running, but it does not by itself guarantee that every new GHCR image is pulled immediately after a push. The recommended setup for this repo is Watchtower with label-gated updates.

This stack opts the app into Watchtower with:

```yaml
labels:
  com.centurylinklabs.watchtower.enable: "true"
```

If you do not already run Watchtower, create a separate Dockge stack from `deploy/watchtower/compose.yml`. That Watchtower stack uses `--label-enable`, so it will only update explicitly opted-in containers.

With the configured Watchtower interval, pushes to `main` should flow like this:

1. GitHub Actions builds and publishes `ghcr.io/toribash67/diplomacy-web:latest`.
2. Watchtower sees the new image within about one minute.
3. Watchtower pulls the image and restarts `diplomacy-web`.
