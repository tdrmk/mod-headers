import styled from 'styled-components'
import { TextBtn } from './Shared.jsx'

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
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 14px;
  font-family: inherit;
  background: #FFFFFF;
  cursor: pointer;
  outline: none;
  &:focus { border-color: #000000; }
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
