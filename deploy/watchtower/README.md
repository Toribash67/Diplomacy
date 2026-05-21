# Watchtower

Use `compose.yml` as a Dockge stack if you do not already run Watchtower.

This stack is intentionally label-gated:

```txt
--label-enable
```

That means Watchtower only updates containers with:

```yaml
labels:
  com.centurylinklabs.watchtower.enable: "true"
```

The Diplomacy Dockge stack already has that label. Other NAS containers will not be touched unless you opt them in.

The interval is `300` seconds, so after GitHub Actions publishes a new `latest` image, the NAS should pick it up within about five minutes.

If the GHCR package is private, run this on the NAS before starting the stack:

```sh
docker login ghcr.io
```

Use a GitHub token with package read access as the password.
