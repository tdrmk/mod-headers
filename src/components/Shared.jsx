import { useState } from 'react'
import styled from 'styled-components'

export const IconBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #999999;
  padding: 2px 4px;
  line-height: 1;
  flex-shrink: 0;
  font-family: inherit;
  &:hover { color: #333333; }
`

export const TextBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #757575;
  font-size: 13px;
  padding: 4px 0;
  font-family: inherit;
  &:hover { color: #000000; }
`

export const FieldInput = styled.input`
  border: 1px solid #E2E2E2;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  font-family: inherit;
  color: inherit;
  width: 100%;
  outline: none;
  background: #FFFFFF;
  &:focus { border-color: #000000; }
  &::placeholder { color: #999999; }
`

export const EmptyText = styled.span`
  font-size: 13px;
  color: #999999;
  padding: 2px 0;
`

const ConfirmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

const ConfirmLabel = styled.span`
  font-size: 12px;
  color: #333333;
`

const ConfirmBtn = styled.button`
  background: #F3F3F3;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  padding: 2px 8px;
  color: #000000;
  &:hover { background: #E2E2E2; }
`

const DeleteBtn = styled(ConfirmBtn)`
  background: #000000;
  color: #FFFFFF;
  &:hover { background: #333333; }
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
