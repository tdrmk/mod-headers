# Mod Headers

A Chrome extension for modifying HTTP request headers on a per-tab basis. Built for developers who need to inject auth tokens, test feature flags, or simulate different environments — without touching other tabs or needing a proxy.

## Features

- **Profiles** — create multiple named configurations, each with its own headers and description
- **Predefined groups** — reusable header sets that can be included in any profile via checkbox
- **Per-tab activation** — enabling a profile only affects the current tab; other tabs are untouched
- **Badge indicator** — the extension icon shows "ON" when headers are active on the current tab
- **Read / Edit / View modes** — profiles open in readonly mode; switch to Edit to modify headers and group inclusion, or View to see the fully resolved set of headers that will actually be sent (deduplicated, last-write-wins)
- **Drag-to-reorder** — drag headers within a profile, and drag groups to set their application order per profile
- **Export / Import** — back up and restore all profiles and groups as a JSON file
- **Sync storage** — profiles and groups are stored in `chrome.storage.sync`, so they follow you across devices

## Getting Started

**Prerequisites:** Node.js and a Chromium-based browser.

```bash
npm install
npm run dev      # builds in watch mode — rebuilds on every file change
```

Then load the extension:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder

The extension reloads automatically on each build when in watch mode, but you may need to click the refresh icon on the extensions page after the first load.

## Building

```bash
npm run build    # one-off production build into dist/
```

Load `dist/` as an unpacked extension as described above. The build copies `manifest.json` from `public/` into `dist/` automatically, so `dist/` is fully self-contained.

## How It Works

<img width="479" height="598" alt="Mod Headers popup showing the Local Dev profile with Auth group included and headers configured" src="https://github.com/user-attachments/assets/930c9810-60e3-4a12-99af-6c9f1a8cec3f" />

### Technical details

The extension is built with **React 19** and **styled-components** for the popup UI, bundled by **Vite** targeting Manifest V3.

Header injection is done entirely through Chrome's [`declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) API using **session rules** — rules that exist only for the current browser session and are automatically cleared when the browser restarts. Rules are scoped to a specific tab ID via the `condition.tabIds` field, so they never affect other tabs.

The service worker (`src/service-worker.js`) manages all rule registration. It uses `chrome.storage.session` (also session-scoped) to track which rule IDs belong to which tab, so the tab→rule mapping survives service worker restarts (which Chrome can do at any time) without leaking rules across tabs.

Profile and group data is persisted in `chrome.storage.sync` via a thin storage module (`src/storage.js`). The sync storage limit is shared across all extension data, so header values should be kept reasonably concise.

### App flow

1. **Popup opens** — loads all profiles and groups from `chrome.storage.sync`, queries the active tab's ID, and checks with the service worker whether that tab currently has rules applied.

2. **User selects a profile** — the popup opens in readonly mode, showing enabled headers and included groups as chips. Switch to **Edit** mode to modify headers, toggle group inclusion, or drag groups to set their application order. Switch to **View** mode to preview the fully resolved, deduplicated header set that will be sent.

3. **Enable** — the popup resolves the full header list: all headers from included groups in their per-profile order (falling back to global group order), followed by directly-added headers that are individually toggled on. Duplicate header names are last-write-wins. It sends an `ENABLE_TAB` message to the service worker with this list and the active tab's ID.

4. **Service worker applies rules** — removes any existing rules for that tab, then registers new `declarativeNetRequest` session rules, one per header. A persisted counter in session storage ensures rule IDs are unique across service worker restarts. The tab's badge is set to "ON".

5. **Disable** — the popup sends a `DISABLE_TAB` message. The service worker looks up the stored rule IDs for that tab, removes them, clears the session entries, and clears the badge.

Only one profile can be active per tab at a time. Enabling a new profile on a tab that already has one active will first remove the old rules before applying the new ones.
