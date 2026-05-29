# Changelog

## 1.0.3
- **Fix:** Nav icons showed as white squares in the installed app — SVGs are now embedded as data URIs at build time instead of referencing file paths, which broke under Electron's `file://` protocol

## 1.0.2
- **Auto-updater UI** — update download progress and a "Restart ↺" button now appear in the title bar when a new version is available; no more silent updates
- **Onboarding step 3** — after creating a first instance the onboarding now shows an "Install & play" slide that explains the INSTALL button and Java auto-download, closing the most common first-run confusion
- **Skin faces on account page** — saved Microsoft and Yggdrasil profiles now show the player's live Minecraft skin face instead of a blank initial; custom uploaded avatars still take priority
- **macOS build target** — release pipeline now produces universal DMG (x64 + arm64) in addition to Windows NSIS and Linux AppImage/deb
- **Community translations** — all UI strings moved to `locales/en.json` and `locales/uk.json`; new languages can be added by copying `en.json` and opening a PR (see `locales/README.md`)
- **Danger zone in Settings** — two-step confirmation to permanently delete all launcher data and exit

## 1.0.1
- **Server ping** — each saved server in the Servers tab shows live latency (colour-coded) and online/max player count; offline servers show a red dot
- **Mod profiles** — save and apply named sets of enabled mods per instance (e.g. "Survival", "Performance"); profiles are stored next to the instance and batch-enable/disable mods on apply
- **Danger zone** — new section at the bottom of Settings with a two-step confirmation to permanently delete all launcher data (instances, mods, themes, Java, cache) and exit
- **Community translations** — all UI strings extracted to `locales/en.json` and `locales/uk.json` with `{{param}}` template syntax; contributors can add a new language by copying `en.json` and opening a PR (see `locales/README.md`)

## 1.0.0
- **Instance detail view** — click any instance card to open a full-screen panel with tabs for Mods, Resource Packs, Shaders, Datapacks, Worlds, Screenshots, Servers, and Updates; modal is fixed at 860 px wide
- **Change instance image** — click the instance icon inside the detail view to replace it with any image from disk
- **Add mods from file** — "+ Add File" button in the detail view installs a local `.jar` directly into the instance mods folder
- **One-click mod updates** — Updates tab shows available Modrinth updates per mod; update individually or all at once
- **Servers tab** — reads `servers.dat` and lists all saved multiplayer servers with icon and IP copy button
- **Yggdrasil authentication** — sign in with any third-party Minecraft auth server (custom server owners / offline servers); stored and refreshed the same way as Microsoft tokens
- **Instance search and filter** — search bar on the Library page filters by name, mod loader, and Minecraft version simultaneously
- **Instance group drag-and-drop** — drag instance cards between groups to reorganise; ungrouped instances have their own section
- **Crash report auto-copy** — when Minecraft crashes the crash log is automatically copied to the clipboard; a "Copy Log" button is also shown in the crash dialog
- **SVG navigation icons** — pixel-art nav icons replaced with clean outlined SVG icons that inherit the active/inactive colour via CSS mask
- **Discord logo** — Discord button in the sidebar now shows the official Discord mark instead of an emoji

## 0.5.1
- All instance cards now uniform — every card has PLAY, MODS, CONSOLE, and Edit
- Java detector now scans Minecraft launcher bundled runtimes (no more ENOENT)
- Forge/NeoForge: installer runs processors that patch the client JAR correctly

## 0.5.0
- Forge and NeoForge modloader install pipeline with processor support
- Mod manager inside each instance: list, enable/disable, delete mods
- Live console log reader for running Minecraft sessions
- Silent crashes now show an error toast with the exit code or message
- Persistent log file saved to AppData; viewable from Settings

## 0.4.0
- Full MC launch pipeline: download, extract natives, assets, Fabric support
- Mod browser powered by Modrinth (mods, shaders, resource packs, modpacks)
- Activity log panel on the Library page
- Modpack install from .mrpack files with automatic Minecraft setup

## 0.3.0
- Avatar and cover image picker for accounts and instances
- Sidebar profile picture reflects the active account and updates live
- Security fixes: path traversal, Zip Slip, HTTPS downgrade, token storage

## 0.2.0
- Instance tabs, delete from Edit dialog, live Minecraft version picker
- Microsoft OAuth device-code flow and offline account support
- PixelScene biome previews on instance cards

## 0.1.0
- Core IPC bridge, config service, and instance management
- App shell, sidebar, TitleBar, and theme engine with Minecraft palette
