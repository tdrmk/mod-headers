// Service worker — applies/removes session rules scoped to a specific tab.
// Uses chrome.storage.session to track which rule IDs belong to which tab,
// so the mapping survives service worker restarts (but not browser restarts,
// which aligns with session rules being cleared on restart anyway).

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ENABLE_TAB') {
    enableTab(message.tabId, message.rules, message.profileId)
      .then((ruleIds) => sendResponse({ ok: true, ruleIds }))
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  if (message.type === 'DISABLE_TAB') {
    disableTab(message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  if (message.type === 'IS_TAB_ENABLED') {
    isTabEnabled(message.tabId)
      .then(({ enabled, appliedProfileId }) => sendResponse({ enabled, appliedProfileId }))
      .catch(() => sendResponse({ enabled: false, appliedProfileId: null }))
    return true
  }
})

async function enableTab(tabId, headers, profileId) {
  // Remove existing rules for this tab before applying new ones.
  await disableTab(tabId)

  const validHeaders = headers.filter((h) => h.name && h.value)
  if (validHeaders.length === 0) return []

  // Use a persisted counter to generate unique rule IDs across service worker restarts.
  const { ruleCounter = 1 } = await chrome.storage.session.get('ruleCounter')

  const rules = validHeaders.map((header, index) => ({
    id: ruleCounter + index,
    priority: 1,
    condition: { tabIds: [tabId] },
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        { header: header.name, operation: 'set', value: header.value },
      ],
    },
  }))

  await chrome.declarativeNetRequest.updateSessionRules({ addRules: rules })

  const ruleIds = rules.map((r) => r.id)

  await chrome.storage.session.set({
    [`tab_${tabId}`]: ruleIds,
    [`tab_${tabId}_profileId`]: profileId ?? null,
    ruleCounter: ruleCounter + rules.length,
  })

  await chrome.action.setBadgeText({ text: 'ON', tabId })
  await chrome.action.setBadgeBackgroundColor({ color: '#1A8917', tabId })

  return ruleIds
}

async function disableTab(tabId) {
  const result = await chrome.storage.session.get(`tab_${tabId}`)
  const ruleIds = result[`tab_${tabId}`] ?? []

  if (ruleIds.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: ruleIds })
    await chrome.storage.session.remove([`tab_${tabId}`, `tab_${tabId}_profileId`])
    await chrome.action.setBadgeText({ text: '', tabId })
  }
}

async function isTabEnabled(tabId) {
  const result = await chrome.storage.session.get([`tab_${tabId}`, `tab_${tabId}_profileId`])
  const ruleIds = result[`tab_${tabId}`] ?? []
  return { enabled: ruleIds.length > 0, appliedProfileId: result[`tab_${tabId}_profileId`] ?? null }
}
