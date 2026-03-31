// Storage layer — all reads and writes to chrome.storage go through here.
// The data model mirrors proposed-design.md exactly.

export function generateId() {
  return crypto.randomUUID()
}

// Load everything from storage in one call.
// Returns { profiles, groups, lastSelectedProfileId }
export async function loadState() {
  const result = await chrome.storage.sync.get([
    'profiles',
    'groups',
    'lastSelectedProfileId',
  ])

  return {
    profiles: result.profiles ?? [],
    groups: result.groups ?? [],
    lastSelectedProfileId: result.lastSelectedProfileId ?? null,
  }
}

// Persist the full profiles array.
export async function saveProfiles(profiles) {
  await chrome.storage.sync.set({ profiles })
}

// Persist the full groups array.
export async function saveGroups(groups) {
  await chrome.storage.sync.set({ groups })
}

// Persist the last selected profile ID.
export async function saveLastSelectedProfileId(id) {
  await chrome.storage.sync.set({ lastSelectedProfileId: id })
}

// Replace all profiles and groups atomically (used by import).
export async function importState(profiles, groups) {
  await chrome.storage.sync.set({ profiles, groups })
}
