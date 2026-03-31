import { useState } from 'react'
import styled from 'styled-components'
import { colors, typography, borders } from '../theme.js'

export const IconBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.contentTertiary};
  padding: 2px 4px;
  line-height: 1;
  flex-shrink: 0;
  font-family: ${typography.fontFamily};
  border-radius: ${borders.radius100};
  &:hover { color: ${colors.contentPrimary}; }
`

export const TextBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.contentSecondary};
  font-size: ${typography.scale200};
  font-family: ${typography.fontFamily};
  padding: 4px 0;
  border-radius: ${borders.radius100};
  &:hover { color: ${colors.contentPrimary}; }
`

export const FieldInput = styled.input`
  border: 1px solid ${colors.borderAccessible};
  border-radius: ${borders.radius100};
  padding: 4px 8px;
  font-size: ${typography.scale300};
  font-family: ${typography.fontFamily};
  color: ${colors.contentPrimary};
  width: 100%;
  outline: none;
  background: ${colors.backgroundPrimary};
  &:focus { border-color: ${colors.borderSelected}; }
  &::placeholder { color: ${colors.contentTertiary}; }
`

export const EmptyText = styled.span`
  font-size: ${typography.scale300};
  color: ${colors.contentTertiary};
  padding: 2px 0;
  font-family: ${typography.fontFamily};
`

const ConfirmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

const ConfirmLabel = styled.span`
  font-size: ${typography.scale200};
  color: ${colors.contentSecondary};
  font-family: ${typography.fontFamily};
`

const ConfirmBtn = styled.button`
  background: ${colors.backgroundSecondary};
  border: none;
  border-radius: ${borders.radius200};
  cursor: pointer;
  font-size: ${typography.scale200};
  font-family: ${typography.fontFamily};
  padding: 4px 10px;
  color: ${colors.contentPrimary};
  &:hover { background: ${colors.backgroundTertiary}; }
`

const DeleteBtn = styled(ConfirmBtn)`
  background: ${colors.primary};
  color: ${colors.primaryB};
  &:hover { background: ${colors.mono900}; }
`

export function DeleteConfirm({ label, onDelete }) {
  const [pending, setPending] = useState(false)

  if (!pending) return <IconBtn title="Delete" onClick={() => setPending(true)}>🗑</IconBtn>

  return (
    <ConfirmRow>
      <ConfirmLabel>{label}</ConfirmLabel>
      <ConfirmBtn onClick={() => setPending(false)}>Cancel</ConfirmBtn>
      <DeleteBtn onClick={onDelete}>Delete</DeleteBtn>
    </ConfirmRow>
  )
}
