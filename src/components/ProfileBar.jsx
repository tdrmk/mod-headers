import styled from 'styled-components'
import { TextBtn } from './Shared.jsx'
import { colors, typography, borders } from '../theme.js'

const Bar = styled.div`
  padding: 12px 16px;
`

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const ProfileSelect = styled.select`
  width: 60%;
  border: 1px solid ${colors.borderAccessible};
  border-radius: ${borders.radius200};
  padding: 6px 10px;
  font-size: ${typography.scale400};
  font-family: ${typography.fontFamily};
  color: ${colors.contentPrimary};
  background: ${colors.backgroundPrimary};
  cursor: pointer;
  outline: none;
  &:focus { border-color: ${colors.borderSelected}; }
`

export default function ProfileBar({ profiles, activeProfileId, appliedProfileId, onSwitch, onAdd }) {
  return (
    <Bar>
      <ProfileRow>
        <ProfileSelect value={activeProfileId ?? ''} onChange={(e) => onSwitch(e.target.value)}>
          {profiles.length === 0 && (
            <option value="" disabled>No profiles</option>
          )}
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.id === appliedProfileId ? `${p.name} ●` : p.name}</option>
          ))}
        </ProfileSelect>

        <TextBtn onClick={onAdd}>+ New</TextBtn>
      </ProfileRow>
    </Bar>
  )
}
