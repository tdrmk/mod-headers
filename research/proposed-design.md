# Proposed Design

All confirmed decisions on scope, UI, behaviour, and CRUD flows.

---

## Confirmed Feature Scope

**Core:**
1. Add / edit / delete header entries (injected into outgoing requests)
2. Per-header enable/disable checkbox
3. Predefined header groups (reusable, referenced by profiles)
4. Multiple profiles with switching (dropdown)
5. Enable on this tab (manual, per-tab activation)
6. Toolbar badge (green = enabled on this tab, grey = not)

**Optional (if time allows):**
7. Export / import profiles (JSON)

---

## Key Behaviour Decisions

**No auto-applying, ever.**
The user manually enables the extension on a tab. Nothing fires automatically on restart or on new tabs.

**Session rules — tab-scoped, cleared on restart.**
- Rules are created via `updateSessionRules` at the moment "Enable on this tab" is clicked.
- Scoped to the specific `tabId` — does not affect any other tab.
- Automatically cleared when the browser restarts.

**Storage — persisted forever.**
- All profiles, headers, groups, and per-header enabled/disabled state live in `chrome.storage`.
- Only the active session rules are not persisted.

**Enable is a snapshot.**
- When you click "Enable on this tab", it reads the current state of storage and applies it.
- Changes made after enabling do not automatically propagate to already-enabled tabs.
- To pick up changes on an active tab: Disable → Enable again.

**Predefined groups are referenced, not copied.**
- A profile holds a reference to a group, not a copy of its headers.
- When enabled, the group's current headers are resolved at that moment.
- Editing a group does not affect already-enabled tabs — only future Enable actions.

**Per-header checkbox is profile-scoped.**
- Checked = include this header when Enable is clicked.
- Unchecked = exclude from session rules, but keep defined in storage.
- Same checkbox state applies regardless of which tab you enable on.

---

## Data Model

```
chrome.storage:
  profiles: [
    {
      id: string,
      name: string,
      description: string,
      groupIds: string[],        ← references to predefined groups
      headers: [
        {
          id: string,
          name: string,
          value: string,
          enabled: boolean
        }
      ]
    }
  ]

  groups: [
    {
      id: string,
      name: string,
      description: string,
      headers: [
        {
          id: string,
          name: string,
          value: string
        }
      ]
    }
  ]

  lastSelectedProfileId: string  ← last selected profile, restored when popup opens
```

---

## UI Layout

**Wider popup (~480px), scrollable, single surface.**

```
┌──────────────────────────────────────────────────┐
│  Mod Headers                                     │
│  Profile: [ Local Dev          ▾ ]  [+]  [🗑]    │
│  "Headers for local development"                 │
├──────────────────────────────────────────────────┤
│  GROUPS                                          │
│  ☑  Production Auth                         [🗑] │
│  ☐  Debug Flags                             [🗑] │
├──────────────────────────────────────────────────┤
│  HEADERS                                         │
│  ☑  Authorization      Bearer abc123        [🗑] │
│  ☐  X-Custom           foo                  [🗑] │
│                        [ + Add Header ]          │
├──────────────────────────────────────────────────┤
│              [ Enable on this tab ]              │
├──────────────────────────────────────────────────┤
│  PREDEFINED GROUPS                  [ + New ]    │
│                                                  │
│  Production Auth                            [🗑] │
│  "Uber production authentication headers"        │
│  ☑  x-uber-uuid     abc123             [🗑]      │
│  ☑  x-uber-token    xyz789             [🗑]      │
│                     [ + Add Header ]             │
│                                                  │
│  Debug Flags                                [🗑] │
│  "Enable verbose server logging"                 │
│  ☑  x-debug-level   verbose            [🗑]      │
│                     [ + Add Header ]             │
└──────────────────────────────────────────────────┘
```

---

## CRUD Flows

### Profile

**Create**
```
Click [+] next to dropdown
→ new inline inputs: [ Profile name... ] [ Description... ] [✓] [✗]
→ confirm → appears in dropdown, becomes active profile
```

**Switch**
```
Click dropdown → select profile → header list updates
```

**Edit name / description**
```
Click on name or description text → turns into inline input
→ click away or Enter to save
```

**Delete**
```
Click [🗑] → confirm: "Delete Local Dev?" [Cancel] [Delete]
→ switches to next available profile
```

---

### Predefined Group

**Create**
```
Click [+ New] in PREDEFINED GROUPS section
→ new group card: [ Group name... ] [ Description... ]
→ (empty header rows) [ + Add Header ]
→ type name + description → add headers → auto-saved
```

**Edit name / description**
```
Click on name or description text → inline input
→ click away or Enter to save
```

**Delete**
```
Click [🗑] on the group
→ confirm: "Delete Production Auth? Used in 2 profiles." [Cancel] [Delete]
→ removed from all profiles that referenced it
```

---

### Header inside a Predefined Group

**Add**
```
Click [+ Add Header] inside the group card
→ new empty row: [ Header name... ] [ Value... ] [🗑]
→ type → click away to save
```

**Edit**
```
Click on name or value cell → inline input
→ click away or Enter to save
→ all profiles referencing this group pick up the change on next Enable
```

**Delete**
```
Click [🗑] → removed immediately
```

---

### Header inside a Profile

**Add**
```
Click [+ Add Header] in HEADERS section
→ new empty row: [ ☑ ] [ Header name... ] [ Value... ] [🗑]
→ type name + value → click away to save
```

**Edit**
```
Click on name or value cell → inline input
→ click away or Enter to save
```

**Enable / Disable**
```
Click checkbox → saved to storage immediately
Unchecked = excluded on next Enable on this tab
```

**Delete**
```
Click [🗑] → removed immediately
```

---

### Group Inclusion in a Profile

**Include**
```
☐ Production Auth → click → ☑ Production Auth
→ saved to profile in storage
→ headers resolved on next Enable on this tab
```

**Exclude**
```
☑ Production Auth → click → ☐ Production Auth
```

---

### Enable / Disable on a Tab

**Enable**
```
Click [ Enable on this tab ]
→ read active profile from storage
→ resolve: included groups (by reference) + individual enabled headers
→ flatten into rule list
→ call updateSessionRules({ addRules: [...] }) scoped to current tabId
→ button flips to [ Disable ]
→ badge turns green
```

**Disable**
```
Click [ Disable ]
→ call updateSessionRules({ removeRuleIds: [...] }) for this tab
→ button flips to [ Enable on this tab ]
→ badge turns grey
```
