# Feature Prioritization — Ease vs. Utility

A breakdown of ModHeader-style features by how commonly they're used vs. how complex they are to build.

---

## The Essential 6

### 1. Add / Edit / Delete Request Headers *(Core — must have)*
This *is* the product. Everything else is optional around this.
- **Usefulness:** Every user needs this
- **Complexity:** Low — straightforward `declarativeNetRequest` `updateDynamicRules()` call
- What to skip for now: response headers (MV3 has restrictions, adds complexity)

---

### 2. Global On/Off Toggle *(High value, trivial to build)*
Single switch to pause all rules without deleting them.
- **Usefulness:** Used constantly — "is this header causing the bug?" toggle-and-reload
- **Complexity:** Very low — just clear DNR rules on off, restore on on

---

### 3. Per-Header Enable/Disable Checkbox *(High value, trivial to build)*
Keep a header defined but temporarily inactive.
- **Usefulness:** Very common — developers keep multiple headers and activate them situationally
- **Complexity:** Very low — just a flag in storage, skip that rule when syncing to DNR

---

### 4. URL Filter — Simple Wildcard *(High value, moderate complexity)*
Scope rules to a specific domain/path so you don't leak tokens to every site.
- **Usefulness:** Critical for safety (auth tokens) and correctness
- **Complexity:** Low-medium — maps directly to `condition.urlFilter` in DNR
- What to skip: regex filter and resource type filter (add later)

---

### 5. Multiple Profiles with Switching *(High value, moderate complexity)*
Named presets — "Local Dev", "Staging", "Production".
- **Usefulness:** Anyone working across multiple environments uses this constantly
- **Complexity:** Medium — mostly a storage and UI problem, not a DNR problem
- What to skip for now: export-as-URL, cloud sync (JSON export is easy enough)

---

### 6. Toolbar Badge *(Nice UX, trivial to build)*
Show active rule count or profile name on the extension icon. Green = on, grey = off.
- **Usefulness:** At-a-glance status without opening the popup
- **Complexity:** Very low — two `chrome.action` API calls

---

## What to Defer

| Feature | Why skip for now |
|---|---|
| Response header modification | MV3 has header restrictions; adds complexity |
| Tab / window filter | Niche use case, non-trivial to implement |
| Dynamic variables `{{uuid}}` | Useful but rarely needed in day-to-day work |
| Undo history | Nice to have, not blocking |
| Autocomplete | Polish feature, add later |
| Export as URL | JSON export covers 90% of the need |
| URL redirect | Different mental model, separate feature |

---

## Proposed UI Layout

```
┌─────────────────────────────────────┐
│ [●] Mod Headers      [● ON ──]      │  global toggle + badge
│ Profile: [Local Dev ▾]  [+] [🗑]    │  profile switcher
├─────────────────────────────────────┤
│ ☑  Authorization   Bearer abc  [✎] │
│ ☑  X-Debug         true        [✎] │
│ ☐  X-Custom        foo         [✎] │  disabled header
│              [+ Add Header]         │
├─────────────────────────────────────┤
│ URL Filter: *://localhost:3000/*     │
└─────────────────────────────────────┘
```

This scope is a **fully functional, shippable extension** — not a toy. It covers the 90% use case
for developers and is achievable without cutting corners.
