# Refract Electron bridge

This package builds the final Electron release used to move existing Electron
installs to the Tauri app.

The old Electron app should auto-update to this package through the existing
Electron update feed. When launched, the bridge fetches the Tauri updater
manifest, downloads the Windows installer, starts it, and quits so the Tauri
installer can replace the Electron install.

## Build

```sh
pnpm --filter @refract/electron-bridge build
```

The build commands pass `--publish never` intentionally. Publishing is handled
by `.github/workflows/release-electron-bridge.yml` with `gh release upload`, so
electron-builder should only create local artifacts.

The default build skips Electron executable signing so it works on local Windows
machines without symlink privilege. Use `build:signed` in release CI if you have
Windows code-signing configured:

```sh
pnpm --filter @refract/electron-bridge build:signed
```

## Runtime overrides

- `REFRACT_TAURI_MANIFEST_URL`: override the Tauri `latest.json` URL.
- `REFRACT_TAURI_INSTALLER_ARGS`: override installer args. Defaults to `/S`.

The default manifest URL is:

```txt
https://github.com/RefractMC/Refract_MC/releases/latest/download/latest.json
```

## Release flow

1. Publish the signed Tauri release first and make sure its `latest.json` is on
   the latest GitHub release.
2. Make sure this bridge package version is higher than the last public
   Electron version.
3. Run the `Release (Electron bridge)` GitHub Actions workflow with the same
   release tag. It uploads `latest.yml`, the bridge installer, and the blockmap
   to that existing release.
4. Existing Electron clients update to the bridge. The bridge installs Tauri.
5. Future updates are handled by `tauri-plugin-updater`.

This assumes the old Electron app used electron-builder's GitHub updater against
`RefractMC/Refract_MC`. If the old Electron updater used a different repository,
bucket, or URL, publish these same three files to that feed instead.
