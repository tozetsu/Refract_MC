<p align="center">
  <img src="logo/refract-iris-256.png" width="96" alt="Refract logo" />
</p>

<h1 align="center">Refract</h1>
<p align="center">A fast, modern, open-source Minecraft launcher built with Electron and React.</p>

<p align="center">
  <a href="https://github.com/RefractMC/Refract_MC/releases/latest">
    <img src="https://img.shields.io/github/v/release/RefractMC/Refract_MC?style=flat-square&color=5316D4" alt="Latest Release" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-5316D4?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Minecraft-Java%20Edition-5316D4?style=flat-square" alt="Minecraft" />
  <a href="https://discord.gg/7Q5sGzhUQJ](https://discord.gg/SUPuuTjMGU">
    <img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" />
  </a>
</p>

<p align="center">
  <img src="logo/screenshot.png" alt="Refract screenshot" width="780" />
</p>

---

## Features

**Instance management**
- Create, group, duplicate, export and delete instances
- Custom install location per instance — store anywhere on any drive
- Drag-and-drop group reordering
- Search and filter by mod loader and Minecraft version
- Pin favourite instances

**Mod & content browsing**
- Browse and install mods, resource packs, shaders, datapacks and modpacks from **Modrinth** and **CurseForge**
- Sort by downloads, followers, newest, recently updated or relevance
- One-click mod updates with a badge showing outdated count
- Bulk enable / disable / delete mods with checkboxes
- Mod profiles — save and switch named sets of enabled mods per instance (e.g. "Survival", "Performance")

**Instance details**
- Worlds tab with last-played date, size and one-click backup to any folder
- Screenshots tab with in-app full-res zoom viewer
- Servers tab with live ping, latency colour-coding and player count
- Resource packs, shaders and datapack management tabs

**Accounts**
- Microsoft device-code login with Java Edition licence verification
- Offline / guest profiles
- Yggdrasil authentication for custom auth servers (e.g. Ely.by)

**Java management**
- Auto-downloads the correct JRE (8 / 17 / 21) for each Minecraft version
- Register any custom `java` / `java.exe` executable from disk
- JVM performance presets — Aikar's flags and Low-end with one click

**Launcher**
- Auto-updater with in-title-bar progress bar and Restart button
- Custom accent colour with preset swatches and a full colour picker
- Dark and light themes
- Crash report auto-copy and in-app console viewer
- MultiMC / Prism Launcher instance import
- Discord Rich Presence — shows instance name, version and elapsed playtime
- Friends panel with NameMC links, UUID copy, whitelist helper and inline notes
- Community translations via `locales/` JSON files

---

## Download

Get the latest release from the [Releases page](https://github.com/RefractMC/Refract_MC/releases/latest).

| Platform | File |
|---|---|
| Windows | `Refract-x.x.x-setup.exe` |
| macOS (Apple Silicon) | `Refract-x.x.x-arm64.dmg` |
| macOS (Intel) | `Refract-x.x.x-x64.dmg` |
| Linux (portable) | `Refract-x.x.x.AppImage` |
| Linux (Debian/Ubuntu) | `Refract-x.x.x.deb` |

> **macOS note:** The DMG is currently unsigned. Right-click → Open on first launch to bypass Gatekeeper.

---

## Translating

All UI strings live in [`locales/en.json`](locales/en.json). To add a new language:

1. Copy `locales/en.json` and name it after the [BCP 47 tag](https://en.wikipedia.org/wiki/IETF_language_tag) for your language (e.g. `fr.json`)
2. Translate the values — keep the JSON keys unchanged
3. Open a pull request

See [`locales/README.md`](locales/README.md) for the full contribution guide.

---

## Development

### Requirements

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

### Setup

```bash
git clone https://github.com/RefractMC/Refract_MC.git
cd Refract_MC
pnpm install
pnpm --filter @refract/app dev
```

### Build

```bash
pnpm --filter @refract/app build
pnpm --filter @refract/app exec electron-builder --win
```

---

## License

All launcher code is available under the [GPL-3.0-only](LICENSE) license.  
The logo and related assets are under the [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) license.
