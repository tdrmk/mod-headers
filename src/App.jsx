import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { loadState, saveProfiles, saveGroups, saveLastSelectedProfileId, generateId, importState } from './storage.js'
import ProfileBar from './components/ProfileBar.jsx'
import HeaderRow from './components/HeaderRow.jsx'
import GroupCard from './components/GroupCard.jsx'
import InlineEdit from './components/InlineEdit.jsx'
import { TextBtn, EmptyText, DeleteConfirm } from './components/Shared.jsx'
import { colors, typography, borders } from './theme.js'

const Popup = styled.div`
  width: 480px;
  font-family: ${typography.fontFamily};
  color: ${colors.contentPrimary};
  background: ${colors.backgroundPrimary};
`

const Loading = styled.div`
  padding: 24px 16px;
  color: ${colors.contentTertiary};
  font-size: ${typography.scale300};
  font-family: ${typography.fontFamily};
`

const ProfileCard = styled.div`
  border: 1px solid ${colors.borderOpaque};
  border-radius: ${borders.radius200};
  margin: 0 16px 12px;
`

const ProfileCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 4px;
`

const ActiveBadge = styled.span`
  font-size: ${typography.scale100};
  font-weight: 600;
  color: ${colors.positive};
  background: ${colors.positiveLight};
  border-radius: ${borders.radius300};
  padding: 2px 8px;
  flex-shrink: 0;
  font-family: ${typography.fontFamily};
`

const ProfileCardDescription = styled.div`
  font-size: ${typography.scale200};
  color: ${colors.contentSecondary};
  padding: 0 12px 8px;
  min-height: 16px;
  font-family: ${typography.fontFamily};
`

const SectionWrapper = styled.div`
  ${({ $border }) => $border && `border-top: 1px solid ${colors.borderOpaque};`}
  padding: 12px 16px;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const SectionLabel = styled.span`
  font-size: ${typography.scale100};
  font-weight: 600;
  color: ${colors.contentTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: ${typography.fontFamily};
`

const GroupRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
`

const GroupRowName = styled.span`
  flex: 1;
  font-size: ${typography.scale300};
  font-family: ${typography.fontFamily};
`

const EnableRow = styled.div`
  padding: 12px 16px;
`

const EnableBtn = styled.button`
  width: 100%;
  padding: 12px;
  background: ${colors.primary};
  color: ${colors.primaryB};
  border: none;
  border-radius: ${borders.radius200};
  font-size: ${typography.scale400};
  font-weight: 500;
  cursor: pointer;
  font-family: ${typography.fontFamily};
  &:hover { background: ${colors.mono900}; }
`

const DisableBtn = styled(EnableBtn)`
  background: ${colors.backgroundSecondary};
  color: ${colors.contentPrimary};
  &:hover { background: ${colors.backgroundTertiary}; }
`

const RunningNotice = styled.div`
  font-size: ${typography.scale200};
  color: ${colors.contentTertiary};
  margin-top: 6px;
  text-align: center;
  font-family: ${typography.fontFamily};
`

const BottomBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid ${colors.borderOpaque};
`

const BarBtn = styled.button`
  background: ${colors.backgroundSecondary};
  border: none;
  border-radius: ${borders.radius200};
  cursor: pointer;
  font-size: ${typography.scale200};
  font-family: ${typography.fontFamily};
  padding: 6px 14px;
  color: ${colors.contentPrimary};
  &:hover { background: ${colors.backgroundTertiary}; }
`

function Section({ label, action, children, border }) {
  return (
    <SectionWrapper $border={border}>
      <SectionHeader>
        <SectionLabel>{label}</SectionLabel>
        {action}
      </SectionHeader>
      {children}
    </SectionWrapper>
  )
}

export default function App() {
  const [profiles, setProfiles] = useState([])
  const [groups, setGroups] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [tabId, setTabId] = useState(null)
  const [enabled, setEnabled] = useState(false)
  const [appliedProfileId, setAppliedProfileId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const state = await loadState()
      setProfiles(state.profiles)
      setGroups(state.groups)

      let profileId = state.lastSelectedProfileId
      if (!state.profiles.find((p) => p.id === profileId)) {
        profileId = state.profiles[0]?.id ?? null
        if (profileId) saveLastSelectedProfileId(profileId)
      }
      setActiveProfileId(profileId)

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      setTabId(tab.id)

      try {
        const { enabled, appliedProfileId } = await chrome.runtime.sendMessage({ type: 'IS_TAB_ENABLED', tabId: tab.id })
        setEnabled(enabled)
        setAppliedProfileId(appliedProfileId)
      } catch {
        // Service worker not yet running — treat as disabled
      }

      setLoading(false)
    }
    init()
  }, [])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  // ── Profile handlers ──────────────────────────────────────────────

  function switchProfile(id) {
    setActiveProfileId(id)
    saveLastSelectedProfileId(id)
  }

  function addProfile() {
    const profile = { id: generateId(), name: `Profile ${profiles.length + 1}`, description: '', groupIds: [], headers: [] }
    const updated = [...profiles, profile]
    setProfiles(updated)
    saveProfiles(updated)
    switchProfile(profile.id)
  }

  function updateProfile(id, changes) {
    const updated = profiles.map((p) => (p.id === id ? { ...p, ...changes } : p))
    setProfiles(updated)
    saveProfiles(updated)
  }

  function deleteProfile(id) {
    const updated = profiles.filter((p) => p.id !== id)
    setProfiles(updated)
    saveProfiles(updated)
    if (activeProfileId === id) {
      if (enabled) {
        chrome.runtime.sendMessage({ type: 'DISABLE_TAB', tabId })
        setEnabled(false)
        setAppliedProfileId(null)
      }
      const next = updated[0]?.id ?? null
      setActiveProfileId(next)
      saveLastSelectedProfileId(next)
    }
  }

  // ── Profile header handlers ───────────────────────────────────────

  function addHeader() {
    updateProfile(activeProfileId, {
      headers: [...activeProfile.headers, { id: generateId(), name: '', value: '', enabled: false }],
    })
  }

  function updateHeader(headerId, changes) {
    updateProfile(activeProfileId, {
      headers: activeProfile.headers.map((h) => (h.id === headerId ? { ...h, ...changes } : h)),
    })
  }

  function deleteHeader(headerId) {
    updateProfile(activeProfileId, {
      headers: activeProfile.headers.filter((h) => h.id !== headerId),
    })
  }

  // ── Group inclusion in profile ────────────────────────────────────

  function toggleGroupInProfile(groupId) {
    const groupIds = activeProfile.groupIds.includes(groupId)
      ? activeProfile.groupIds.filter((id) => id !== groupId)
      : [...activeProfile.groupIds, groupId]
    updateProfile(activeProfileId, { groupIds })
  }

  // ── Predefined group handlers ─────────────────────────────────────

  function addGroup() {
    const group = { id: generateId(), name: `Group ${groups.length + 1}`, description: '', headers: [] }
    const updated = [group, ...groups]
    setGroups(updated)
    saveGroups(updated)
  }

  function updateGroup(groupId, changes) {
    const updated = groups.map((g) => (g.id === groupId ? { ...g, ...changes } : g))
    setGroups(updated)
    saveGroups(updated)
  }

  function deleteGroup(groupId) {
    const updatedGroups = groups.filter((g) => g.id !== groupId)
    setGroups(updatedGroups)
    saveGroups(updatedGroups)

    // Remove the reference from all profiles.
    const updatedProfiles = profiles.map((p) => ({
      ...p,
      groupIds: p.groupIds.filter((id) => id !== groupId),
    }))
    setProfiles(updatedProfiles)
    saveProfiles(updatedProfiles)
  }

  function addGroupHeader(groupId) {
    const group = groups.find((g) => g.id === groupId)
    updateGroup(groupId, {
      headers: [...group.headers, { id: generateId(), name: '', value: '' }],
    })
  }

  function updateGroupHeader(groupId, headerId, changes) {
    const group = groups.find((g) => g.id === groupId)
    updateGroup(groupId, {
      headers: group.headers.map((h) => (h.id === headerId ? { ...h, ...changes } : h)),
    })
  }

  function deleteGroupHeader(groupId, headerId) {
    const group = groups.find((g) => g.id === groupId)
    updateGroup(groupId, {
      headers: group.headers.filter((h) => h.id !== headerId),
    })
  }

  // ── Enable / Disable ──────────────────────────────────────────────

  async function handleEnable() {
    // Resolve: all group headers (no per-header toggle in groups) first, then individually-enabled profile headers.
    const headers = []
    for (const groupId of activeProfile.groupIds) {
      const group = groups.find((g) => g.id === groupId)
      if (group) headers.push(...group.headers)
    }
    headers.push(...activeProfile.headers.filter((h) => h.enabled))

    const response = await chrome.runtime.sendMessage({
      type: 'ENABLE_TAB',
      tabId,
      rules: headers,
      profileId: activeProfileId,
    })

    if (response.ok) {
      setEnabled(true)
      setAppliedProfileId(activeProfileId)
    }
  }

  async function handleDisable() {
    await chrome.runtime.sendMessage({ type: 'DISABLE_TAB', tabId })
    setEnabled(false)
    setAppliedProfileId(null)
  }

  // ── Export / Import ───────────────────────────────────────────────

  function handleExport() {
    const data = JSON.stringify({ profiles, groups }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mod-headers.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { profiles: p, groups: g } = JSON.parse(e.target.result)
        if (!Array.isArray(p) || !Array.isArray(g)) return
        importState(p, g)
        setProfiles(p)
        setGroups(g)
        const firstId = p[0]?.id ?? null
        setActiveProfileId(firstId)
        saveLastSelectedProfileId(firstId)
        if (enabled) {
          chrome.runtime.sendMessage({ type: 'DISABLE_TAB', tabId })
          setEnabled(false)
          setAppliedProfileId(null)
        }
      } catch { /* invalid JSON — ignore */ }
    }
    reader.readAsText(file)
  }

  // ── Render ────────────────────────────────────────────────────────

  if (loading) return <Loading>Loading...</Loading>

  return (
    <Popup>
      <ProfileBar
        profiles={profiles}
        activeProfileId={activeProfileId}
        appliedProfileId={enabled ? appliedProfileId : null}
        onSwitch={switchProfile}
        onAdd={addProfile}
      />

      {activeProfile ? (
        <ProfileCard>
          <ProfileCardTop>
            <div style={{ flex: 1, fontWeight: 500, fontSize: typography.scale400 }}>
              <InlineEdit
                value={activeProfile.name}
                onChange={(v) => updateProfile(activeProfileId, { name: v })}
                placeholder="Profile name"
              />
            </div>
            {enabled && appliedProfileId === activeProfileId && <ActiveBadge>Active</ActiveBadge>}
            <DeleteConfirm label={`Delete "${activeProfile.name}"?`} onDelete={() => deleteProfile(activeProfileId)} />
          </ProfileCardTop>
          <ProfileCardDescription>
            <InlineEdit
              value={activeProfile.description}
              onChange={(v) => updateProfile(activeProfileId, { description: v })}
              placeholder="Add a description"
            />
          </ProfileCardDescription>

          <Section label="Groups">
            {groups.filter((g) => g.headers.some((h) => h.name && h.value)).length === 0 ? (
              <EmptyText>No predefined groups with valid headers yet — add one below.</EmptyText>
            ) : (
              groups
                .filter((g) => g.headers.some((h) => h.name && h.value))
                .map((group) => (
                  <GroupRow key={group.id}>
                    <input
                      type="checkbox"
                      checked={activeProfile.groupIds.includes(group.id)}
                      onChange={() => toggleGroupInProfile(group.id)}
                    />
                    <GroupRowName>{group.name}</GroupRowName>
                  </GroupRow>
                ))
            )}
          </Section>

          <Section label="Headers">
            {activeProfile.headers.map((header) => (
              <HeaderRow
                key={header.id}
                header={header}
                onChange={(changes) => updateHeader(header.id, changes)}
                onDelete={() => deleteHeader(header.id)}
              />
            ))}
            <TextBtn onClick={addHeader}>+ Add Header</TextBtn>
          </Section>

          <EnableRow>
            {(() => {
              const appliedProfile = profiles.find((p) => p.id === appliedProfileId)
              const isApplied = enabled && appliedProfileId === activeProfileId
              const otherRunning = enabled && appliedProfileId !== activeProfileId
              const hasValidHeaders = activeProfile.groupIds.some((id) => {
                const g = groups.find((g) => g.id === id)
                return g && g.headers.some((h) => h.name && h.value)
              }) || activeProfile.headers.some((h) => h.enabled && h.name && h.value)
              return (
                <>
                  {isApplied ? (
                    <DisableBtn onClick={handleDisable}>Disable {activeProfile.name}</DisableBtn>
                  ) : otherRunning && appliedProfile ? (
                    <DisableBtn onClick={handleDisable}>Disable {appliedProfile.name}</DisableBtn>
                  ) : hasValidHeaders ? (
                    <EnableBtn onClick={handleEnable}>Enable {activeProfile.name} on this tab</EnableBtn>
                  ) : (
                    <RunningNotice>Add headers or include a group to enable.</RunningNotice>
                  )}
                </>
              )
            })()}
          </EnableRow>
        </ProfileCard>
      ) : (
        <SectionWrapper $border>
          <EmptyText>No profiles yet. Click ＋ to create one.</EmptyText>
        </SectionWrapper>
      )}

      <Section
        border
        label="Predefined Groups"
        action={<TextBtn onClick={addGroup}>+ New</TextBtn>}
      >
        {groups.length === 0 && <EmptyText>No groups yet.</EmptyText>}
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onUpdate={(changes) => updateGroup(group.id, changes)}
            onDelete={() => deleteGroup(group.id)}
            onAddHeader={() => addGroupHeader(group.id)}
            onUpdateHeader={(headerId, changes) => updateGroupHeader(group.id, headerId, changes)}
            onDeleteHeader={(headerId) => deleteGroupHeader(group.id, headerId)}
          />
        ))}
      </Section>

      <BottomBar>
        <BarBtn onClick={handleExport}>↑ Export</BarBtn>
        <label style={{ display: 'contents' }}>
          <BarBtn as="span">↓ Import</BarBtn>
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files[0]) handleImport(e.target.files[0]); e.target.value = '' }}
          />
        </label>
      </BottomBar>
    </Popup>
  )
}
