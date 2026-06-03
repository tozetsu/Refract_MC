# Changelog

## 1.0.7
- **Skin manager** — new Skins page in the sidebar: save a personal library of skin PNGs, preview them in a 3D rotating player model (powered by skinview3d), and upload directly to your Microsoft account with one click; Classic (Steve) and Slim (Alex) variants supported
- **3D skin viewer** — full Three.js-based player model in the Accounts page skin panel and the Skins library; skin textures loaded as base64 data URIs to work correctly in packaged Electron builds
- **Fix: close button fully quits** — clicking ✕ now exits the process; a single-instance lock also prevents duplicate launcher processes when re-opening
- **Fix: offline accounts can launch** — removed the incorrect "Buy Minecraft" block for offline/guest profiles; they can now launch instances and connect to offline-mode servers
- **Fix: sidebar Account nav removed** — clicking the avatar block at the top navigates to Accounts, reducing the nav to 3 items (Library, Browse Mods, Modpacks, Skins)
- **Fix: modpack install no longer blocks the UI** — download progress moved to a non-blocking 320px floating card at the bottom-right; browse, search, and navigate freely while a modpack installs
- **Fix: tab content cached in instance detail** — Worlds, Screenshots, Servers, and Updates tabs no longer re-fetch on every revisit; data is loaded once per dialog open
- **Fix: Minecraft version list cached** — version list is cached for 30 minutes in the main process; opening Create/Edit Instance is now instant after the first load
- **Fix: Modrinth game versions cached** — the version filter dropdown in Browse Mods caches for 1 hour
- **Fix: window title** — title bar and taskbar now show "Refract Launcher" instead of "Refract"
- **Fix: Ukrainian localization** — Yggdrasil auth section, CurseForge modpacks panel, Skins page, and account skin panel are now fully translated; "Install as Instance" shortened to "ВСТАНОВИТИ"

## 1.0.6
- **New Instance redesign** — completely rebuilt dialog with violet brand system, live preview card (pixel skyline, updates as you type), segmented mod loader control, GB memory slider that reads your system's actual RAM
- **Edit Instance redesign** — same brand system applied to the Edit dialog with matching live preview, JVM presets (Aikar's / Low-end), and danger-zone delete flow
- **Playtime stats panel** — per-instance bar chart and 7-day activity chart on the home page showing hours played
- **Mod dependency resolver** — when installing a mod from Browse Mods, Refract checks required dependencies and offers to install missing ones in the same step
- **Version release notes** — the version picker now shows a one-line "What's new" blurb from Mojang's patch notes when you select a Minecraft version
- **Recommended mods** — Browse Mods shows popular mods filtered to your most-recently-played instance's version and loader when search is empty
- **Ely.by / Yggdrasil fix** — login now retries both `/authserver/authenticate` and `/auth/authenticate` endpoints, fixing "Page not found" errors on Ely.by
- **Fix:** app now starts on the Instance Library instead of an "Unknown page" on fresh installs (switched to hash history routing)
- **Fix:** Discord invite link updated

## 1.0.5
- **System tray** — closing the window now minimises to the system tray instead of quitting; double-click to restore, right-click for a quick-launch menu with the last-played instance and Quit
- **Opt-in updates** — the launcher no longer downloads updates automatically; a chip appears in the title bar when a new version is found with an **Update** button to start the download and a **✕** to dismiss and stay on the current version
- **Mod search** — a search bar appears in the Mods tab when more than 6 mods are installed, filtering by name in real time
- **Notifications** — native OS notifications fire when a modpack finishes installing, when Minecraft crashes, and when an update download is ready
- **Playtime chart** — a 7-day mini bar chart appears in the instance detail header after the first play session; today's bar is shown in the accent colour
- **Instance-aware mod browser** — pick an instance from the Browse Mods page to see which mods are already **DOWNLOADED**, which have an **UPDATE** available, and which are **incompatible** with the instance's version or loader; selecting an instance auto-applies its MC version and loader as filters
- **Fix:** memory slider now caps to actual system RAM instead of always showing 32 GB as the maximum
- **Fix:** What's New panel now fetches release notes directly from CHANGELOG.md (always up to date) and scrolls instead of expanding the layout
- **Fix:** Ukrainian language now fully covers the instance detail modal (tabs, empty messages, buttons, profiles, server ping labels)
- **Fix:** Create/Edit instance dialogs widened to 640 px to accommodate longer Ukrainian text
- **Fix:** language segment buttons auto-size to their text; memory quick-pick buttons wrap on high-RAM machines

## 1.0.4
- **Custom accent color** — pick any colour in Settings → Appearance via preset swatches or a full colour picker; persisted across restarts with derived hi/lo/tint variants
- **Bulk mod operations** — checkboxes on every mod row; a bulk action bar appears with Enable / Disable / Delete and Select-all when any are ticked
- **JVM performance presets** — one-click "Aikar's flags" and "Low-end" preset buttons below the JVM args field in Edit Instance
- **World backup** — Backup button on each world row opens a Save dialog and zips the world folder to any location
- **Screenshot lightbox** — clicking a screenshot now opens a full-res in-app viewer instead of the OS photo app; Escape or click outside closes only the viewer, not the parent dialog
- **CurseForge modpacks** — Modpacks browser has a Modrinth / CurseForge source toggle; CurseForge modpacks download and install via the existing manifest.json pipeline (requires a CurseForge API key in Settings)
- **Sort in Browse Mods** — same sort dropdown as the Modpacks page (Most Downloaded, Newest, etc.) is now available on the Modrinth mod browser
- **Page jump** — pagination on Browse Mods and Modpacks now includes an editable page-number input; type a number and press Enter to jump directly
- **Custom instance location** — a Location field + Browse button in Create Instance lets you store any instance outside the default AppData folder
- **Custom Java path** — Settings → Java Runtime now has a text field and Browse button to register any java/java.exe executable; validates on add and shows a gold "custom" badge in the list
- **Hover glow** — all buttons in the app brighten on hover via a global CSS rule
- **Fix:** closing gallery images or screenshot lightbox no longer accidentally dismisses the parent modal (all backdrops now use target === currentTarget guard)
- **Fix:** What's New release notes are now auto-populated from CHANGELOG.md by CI after each build

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
