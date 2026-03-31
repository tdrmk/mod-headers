# How It Works — Core Mental Model

## The Core Loop

This is the heart of the entire extension:

```
User clicks "Enable on this tab"
        ↓
Extension reads current profile from chrome.storage
        ↓
Extension calls updateSessionRules() scoped to this tab's ID
        ↓
Chrome now holds the rule internally
        ↓
Every matching request from that tab gets the header — no JS runs per request
```

Everything else — profiles, groups, the badge — is just **UI and storage
logic** layered on top of that same loop.

---

## How Each Feature Maps to the Loop

| Feature | What changes in the loop |
|---|---|
| Add / edit / delete a header | Saved to `chrome.storage` — picked up on next Enable |
| Per-header checkbox off | Excluded when resolving headers at Enable time |
| Enable on this tab | Read storage, call `updateSessionRules()` scoped to `tabId` |
| Disable on this tab | Call `updateSessionRules({ removeRuleIds: [...] })` for this tab |
| Profile switch | No rule change — rules only change on the next Enable |
| Toolbar badge | Set via `chrome.action.setBadgeText()` when enabling/disabling |

---

## Background: Old Way vs. New Way

When a Chrome extension needs to intercept network requests, Chrome provides two systems:

**Old way (Manifest V2) — `webRequest`**
Your extension's JavaScript code literally intercepts every network request, reads it, modifies it,
and passes it on. Like a middleman reading every letter before it gets sent. Flexible, but slow and
privacy-invasive — your code sees every request the browser makes.

**New way (Manifest V3) — `declarativeNetRequest`**
Instead of running your code on every request, you hand Chrome a list of rules upfront and Chrome
handles the matching itself, internally. Your JavaScript never runs per-request. Faster, more
private, and required for new extensions as of MV3.

`webRequestBlocking` (the part that allowed modifications) was removed in MV3. `declarativeNetRequest`
is its replacement.

---

## `declarativeNetRequest` (DNR)

"Declarative" = you *declare* what you want, rather than writing code that *does* it step by step.

Think of it like setting up an email filter:
> "If an email comes from `boss@company.com`, move it to the Important folder."

You don't write code that checks every email. You just declare the rule and the email client handles it.

DNR works the same way:
> "If a request goes to `*.localhost:3000/*`, add the header `Authorization: Bearer abc`."

Chrome evaluates that rule against every request internally — your extension's JavaScript never
runs per-request.

---

## Rule Types in DNR

A single DNR rule can do one of these things:

| Action | What it does |
|---|---|
| `modifyHeaders` | Add, change, or remove a header |
| `redirect` | Send the request to a different URL |
| `block` | Cancel the request entirely |
| `allow` | Explicitly let a request through (overrides block rules) |

A rule looks like this:
```json
{
  "id": 1,
  "priority": 1,
  "condition": {
    "urlFilter": "*://localhost:3000/*"
  },
  "action": {
    "type": "modifyHeaders",
    "requestHeaders": [
      { "header": "Authorization", "operation": "set", "value": "Bearer abc123" }
    ]
  }
}
```
Read it as: *"For any request going to localhost:3000, set the Authorization header to Bearer abc123."*

The `operation` field inside `requestHeaders` can be:
- `"set"` — add if absent, overwrite if present
- `"remove"` — strip the header entirely
- `"append"` — add to an existing header value (only supported on an allowlisted set of headers)

---

## The Three Rule Buckets

DNR has three places rules can live:

| Bucket | Set by | Persists after restart? | Max rules |
|---|---|---|---|
| **Static rules** | Files bundled with the extension at install time | Yes | 30,000 |
| **Dynamic rules** | Extension code at runtime via `updateDynamicRules()` | Yes | 5,000 |
| **Session rules** | Extension code at runtime via `updateSessionRules()` | No — cleared on restart | 5,000 |

For this extension, **session rules** are what we use — they're applied at Enable time, scoped to
a specific tab ID, and cleared automatically when the browser restarts (which aligns with the
intentional design: nothing fires automatically, the user always manually enables per tab).

Dynamic rules would survive restarts and apply globally — that's the wrong model here.

---

## `updateSessionRules()`

The function that adds/removes rules from the session bucket at runtime. Called when the user
clicks Enable or Disable on a tab:

```js
chrome.declarativeNetRequest.updateSessionRules({
  removeRuleIds: [1, 2],   // delete rules with these IDs first
  addRules: [              // then add these new rules
    {
      id: 3,
      priority: 1,
      condition: { tabIds: [tabId] },   // ← scoped to this tab only
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          { header: "Authorization", operation: "set", value: "Bearer abc" }
        ]
      }
    }
  ]
})
```

What triggers this call:
- **Enable on this tab** → remove any existing rules for that tab, then `addRules` for all resolved headers
- **Disable on this tab** → `removeRuleIds` only

Edits to headers in storage do **not** immediately update running tabs — the user must Disable and
re-Enable to pick up changes on an already-active tab.

---

## `chrome.storage`

The extension needs to remember the user's headers even after the popup closes or the browser
restarts. It can't use `localStorage` (that's for web pages). Instead it uses:

- **`chrome.storage.sync`** — automatically synced across all Chrome instances signed into the same
  Google account. 100KB limit. This is where profiles and groups live.
- **`chrome.storage.session`** — session-scoped, cleared on browser restart. This is where the
  service worker tracks which rule IDs belong to which tab, and a counter to ensure unique rule IDs
  across service worker restarts.

Storage is the source of truth. Session rules are the live reflection — applied manually by the
user per tab, cleared on browser restart by design.

---

## The Bottom Line

The Chrome API (`declarativeNetRequest`) does the heavy lifting. Our extension is really just a
**UI for managing a list of header definitions**, and a bit of glue code that translates a user's
"Enable on this tab" click into the right session rules for that tab.
