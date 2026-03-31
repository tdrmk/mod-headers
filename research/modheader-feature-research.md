# Mod Headers Chrome Extension — Feature Research

## Overview

ModHeader is the dominant "modify HTTP headers" Chrome extension (800k+ users). This document captures research on its full feature set, technical implementation approach, and UX patterns — used as a reference for building our own equivalent extension.

---

## Core Operations

### 1. Add Header
Injects a brand-new header into the request/response that the server/browser wouldn't otherwise see.

**Example use cases:**
- Add `Authorization: Bearer <token>` to authenticate without changing app code
- Add `X-Custom-Debug: true` to trigger special server behavior
- Add `Accept-Language: ja` to test localization

**DNR rule shape:**
```json
{
  "action": {
    "type": "modifyHeaders",
    "requestHeaders": [
      { "header": "Authorization", "operation": "set", "value": "Bearer abc123" }
    ]
  }
}
```
`"set"` — adds if absent, overwrites if already present.

---

### 2. Modify Header
Overwrites the value of a header that already exists (same `"set"` operation in DNR — it's add-or-overwrite).

**Example use cases:**
- Override `User-Agent` to spoof a mobile browser
- Override `Origin` or `Referer` for CORS testing
- Change `Content-Type` on a request

---

### 3. Remove Header
Strips a header entirely before the request leaves the browser or before the response reaches the page.

**Example use cases:**
- Remove `Cookie` header to test unauthenticated flows
- Remove `X-Frame-Options` from responses to allow embedding
- Strip `Content-Security-Policy` to debug CSP issues

**DNR rule shape:**
```json
{ "header": "X-Frame-Options", "operation": "remove" }
```

---

### 4. Append
Adds a value to a header that already exists, rather than replacing it.

**Example use cases:**
- Append to `Cookie: existing=value; new=value`
- Add to `Accept-Encoding`

**Limitation:** DNR only supports `append` on a specific allowlist of headers (`accept`, `accept-encoding`, `cookie`, `user-agent`, `x-forwarded-for`, etc.) — not arbitrary headers.

---

### 5. URL Redirect
Intercepts a matching request and returns a different URL instead.

**Example use cases:**
- Redirect `api.prod.com/*` → `api.staging.com/*` for local testing
- Redirect a CDN asset to a local file server
- Force HTTP → HTTPS

**DNR rule shape:**
```json
{
  "action": {
    "type": "redirect",
    "redirect": { "regexSubstitution": "https://staging.example.com\\1" }
  }
}
```

---

## Filtering System

Filters determine **when** a rule fires. Rules without filters apply to every single HTTP request (dangerous for things like `Authorization` tokens).

All filters on a rule use **AND logic** — a request must match *all* conditions for the rule to fire:
```
URL matches *.example.com/*
AND resource type is xmlhttprequest
AND tab ID is 42
→ then set Authorization header
```

### 1. URL Filter
The most common filter. Matches the request URL against a pattern.

| Pattern type | Example | Matches |
|---|---|---|
| Exact | `https://api.example.com/v1/users` | Only that URL |
| Wildcard | `*://api.example.com/*` | Any path on that host |
| Regex | `^https://.*\.example\.com/api/` | Subdomain + path pattern |
| Domain | `*://example.com/*` | All pages on a domain |

In DNR, this maps to `condition.urlFilter` (simple wildcard) or `condition.regexFilter` (full regex).

---

### 2. Tab Filter
Scopes a rule to **one specific browser tab** — the tab you're currently working in.

**Why it matters:** If you add an `Authorization` header globally, every tab (including banking sites) gets that header. Tab filter prevents leakage.

**How it works technically:** DNR has "session rules" (`updateSessionRules`) which can be scoped to a tab via `condition.tabIds: [tabId]`. The extension listens to `chrome.tabs` events to track which tab the user pinned the rule to.

**Typical UX:** A "pin to tab" button in the popup — the active tab's ID gets saved with the rule.

---

### 3. Resource Type Filter
Applies a rule only to certain kinds of requests:

| Type | When it fires |
|---|---|
| `xmlhttprequest` | `fetch()` / `XMLHttpRequest` calls |
| `main_frame` | Top-level page navigations |
| `sub_frame` | `<iframe>` loads |
| `script` | `<script src="...">` |
| `image` | `<img src="...">` |
| `stylesheet` | `<link rel="stylesheet">` |
| `websocket` | WebSocket upgrades |

**Example use case:** Add a debug header only to XHR calls, not page navigations.

**DNR mapping:** `condition.resourceTypes: ["xmlhttprequest", "fetch"]`

---

### 4. Window / Tab Group Filter
Same idea as tab filter but scoped to a whole browser window or tab group. Useful for "I want this rule active for my work window but not my personal window."

Implemented by tracking `chrome.windows` / `chrome.tabGroups` IDs.

---

## Profile Management

### What is a Profile?
A profile is a **named collection of rules** (headers, redirects, filters). Think of it like a workspace preset — you activate one profile and all its rules become live.

```
Profile: "Local Dev"
  ├── Authorization: Bearer dev-token-123
  ├── X-Debug: true
  └── URL filter: localhost:3000/*

Profile: "Staging QA"
  ├── Authorization: Bearer qa-token-456
  ├── X-Environment: staging
  └── URL filter: staging.example.com/*
```

### Core Profile Operations

**Create / Rename / Delete**
Basic CRUD. Each profile has a unique name and an enable/disable state independent of others.

**Clone**
Duplicate an existing profile as a starting point. Common pattern: clone "Production" → rename to "Staging" → swap out the token and URL filter.

**Enable / Disable**
Each profile has its own toggle. You can have multiple profiles *defined* but only one (or none) *active* at a time — or allow multiple active simultaneously for layered rules.

**Switch**
Quick-swap between profiles from the popup without editing anything. Critical for developers juggling multiple projects or environments.

### Import / Export

**Export as JSON**
Serializes all rules + filters into a portable file. Used for:
- Backing up your config
- Sharing with a teammate ("use this to hit our staging API")
- Version-controlling your header setup alongside the project

**Export as URL**
Encodes the profile into a shareable URL. Recipient clicks it → extension auto-imports. Nice onboarding flow for teams.

**Import**
Accepts JSON file or URL. Merges into existing profiles or replaces — user's choice.

### Storage Strategy
Profiles live in `chrome.storage.sync` — automatically sync across all Chrome instances signed into the same Google account. No manual cloud setup needed. Limit is 100KB total, which is plenty for header rules.

For larger data, fall back to `chrome.storage.local` (10MB limit).

---

## Quality-of-Life UX

### 1. Global On/Off Toggle
A single switch (usually in the popup header) that **pauses all rules** without deleting them. The toolbar icon changes color/icon to show the extension is paused.

Implemented by clearing all DNR dynamic rules when off, restoring them when on.

**Why it matters:** Fastest way to check "is this header causing the bug?" — toggle off, reload, see if behavior changes.

---

### 2. Per-Header Enable/Disable Checkbox
Each row in the header list has its own toggle. You can keep a header defined but inactive — useful for headers you use occasionally and don't want to retype.

---

### 3. Undo
Tracks a history of rule changes (add, edit, delete). One-click undo. Implemented as a simple in-memory or `storage`-backed change stack — no git required.

**Why it matters:** Typos in header values or accidental deletes are common. Without undo, users have to remember what they had.

---

### 4. Autocomplete for Header Names
When typing a header name, suggests from a built-in list of ~100 common headers:

```
Auth...
  → Authorization
  → Access-Control-Allow-Origin
  → Access-Control-Request-Headers
```

Also learns from headers you've used before (stored in `chrome.storage`).

**Why it matters:** Nobody memorizes `Access-Control-Allow-Headers` — autocomplete eliminates typos in header names.

---

### 5. Dynamic Variables
Placeholder tokens that resolve to a computed value at request time:

| Variable | Resolves to |
|---|---|
| `{{timestamp}}` | Current Unix timestamp |
| `{{uuid}}` | Random UUID v4 |
| `{{date}}` | Current date `YYYY-MM-DD` |
| `{{randomInt}}` | Random integer |

**Example use case:**
```
X-Request-ID: {{uuid}}
X-Sent-At: {{timestamp}}
```
Every request gets a unique ID automatically — useful for tracing requests in server logs.

Implemented in the service worker: before applying a rule, scan the value for `{{...}}` tokens and substitute them.

---

### 6. Comments on Headers
A third column next to name/value for a human-readable note:

```
Name                  Value              Comment
Authorization         Bearer abc123      Dev token — expires 2026-04-01
X-Feature-Flag        checkout-v2        A/B test override
```

Stored alongside the rule, never sent in the actual request. Helps teams understand *why* a header exists.

---

### 7. Toolbar Badge
The extension icon in the Chrome toolbar shows a small badge:
- **Color** — green = active, grey = paused
- **Label** — short text like the profile name or rule count (`"3"` = 3 active rules)

Customizable so teams can color-code profiles (red = production, blue = staging).

Implemented via `chrome.action.setBadgeText()` and `chrome.action.setBadgeBackgroundColor()`.

---

### 8. Sort Headers
Sort the header list by name, value, or comment alphabetically. Purely cosmetic/organizational — doesn't affect rule evaluation order (DNR uses `priority` for that).

---

### 9. Dark Mode
Respects the OS-level `prefers-color-scheme: dark` media query, or has a manual toggle in settings. Standard CSS variable theming pattern.

---

## Typical Popup UI Layout

```
┌─────────────────────────────────────┐
│ [●] My Extension        [ON ●──]    │  ← global toggle + badge config
│ Profile: [Local Dev ▾] [+ Clone]    │  ← profile switcher
├─────────────────────────────────────┤
│ ☑ Authorization    Bearer abc  [✎] │
│ ☑ X-Debug          true        [✎] │
│ ☐ X-Trace-ID       {{uuid}}    [✎] │  ← disabled row
│ [+ Add Header]              [↩ Undo]│
├─────────────────────────────────────┤
│ URL Filter: *://localhost/*         │
│ Resource:   [XHR] [Fetch]           │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### Chrome Extension APIs

| Feature | API |
|---|---|
| Modify request headers | `chrome.declarativeNetRequest` (MV3) |
| Modify response headers | `chrome.declarativeNetRequest` (MV3) |
| URL redirect | `chrome.declarativeNetRequest` |
| Store profiles/settings | `chrome.storage.sync` / `chrome.storage.local` |
| Tab filtering | `chrome.tabs` + DNR session rules |
| Context menu (pause/resume) | `chrome.contextMenus` |
| Periodic cloud sync | `chrome.alarms` |

### Why `declarativeNetRequest` (not `webRequest`)
- MV3 removed `webRequestBlocking` — `declarativeNetRequest` (DNR) is the replacement
- Rules are evaluated **in the browser itself**, not in a JS background page — faster and more private
- `updateDynamicRules()` allows runtime rule changes driven by the UI
- `updateSessionRules()` supports tab-scoped rules (cleared on browser restart)
- Host permissions (`<all_urls>`) are required to modify headers or redirect

### Required Permissions (`manifest.json`)
```json
{
  "manifest_version": 3,
  "permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestFeedback",
    "storage",
    "contextMenus",
    "alarms",
    "tabs"
  ],
  "host_permissions": ["<all_urls>"]
}
```

### Suggested Tech Stack
- **Framework**: React + TypeScript (popup + options page)
- **Build tool**: Vite with CRXJS plugin
- **Styling**: Tailwind CSS or CSS Modules
- **State**: Zustand or React Context synced with `chrome.storage`

---

## Proposed Feature Roadmap

### Phase 1 — Core (MVP)
1. Add / edit / delete request headers
2. Enable / disable individual headers
3. Global on/off toggle (toolbar icon)
4. Persist settings via `chrome.storage`
5. Basic URL filter (exact or glob match)
6. Apply rules via `declarativeNetRequest` dynamic rules

### Phase 2 — Profiles & UX
7. Multiple named profiles
8. Switch between profiles
9. Clone / delete profiles
10. Export / import profiles (JSON)
11. Dark mode

### Phase 3 — Advanced
12. Response header modification
13. URL redirect rules
14. Tab/window filter
15. Resource type filter
16. Dynamic variables (`{{uuid}}`, `{{timestamp}}`)
17. Undo history
18. Autocomplete for header names

---

## Open Source References
- [edit-request-headers](https://github.com/gromnitsky/edit-request-headers) — MV3, uses DNR
- [chrome-extension-modify-headers-manifest-v3](https://github.com/varunon9/chrome-extension-modify-headers-manifest-v3) — sample MV3 implementation
- [a8c-chrome-mod-header](https://github.com/Automattic/a8c-chrome-mod-header) — Automattic's open source implementation
- [ModHeader official docs](https://modheader.com/docs/using-modheader/modify-request-headers)
- [chrome.declarativeNetRequest API docs](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
