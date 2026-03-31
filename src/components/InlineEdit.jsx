import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { colors, typography, borders } from '../theme.js'

const EditSpan = styled.span`
  cursor: text;
  border-radius: ${borders.radius100};
  min-width: 20px;
  display: inline-block;
  font-family: ${typography.fontFamily};
  &:hover { background: ${colors.backgroundSecondary}; }
`

const Placeholder = styled.span`
  color: ${colors.contentTertiary};
`

const EditInput = styled.input`
  border: 1px solid ${colors.borderSelected};
  border-radius: ${borders.radius100};
  padding: 1px 5px;
  font-size: inherit;
  font-family: ${typography.fontFamily};
  width: 100%;
  outline: none;
  color: ${colors.contentPrimary};
  background: ${colors.backgroundPrimary};
`

// Renders as plain text; clicking it turns it into an input.
// Saves on blur or Enter. Cancels on Escape.
export default function InlineEdit({ value, onChange, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef(null)

  useEffect(() => {
    if (editing) ref.current?.select()
  }, [editing])

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== value) onChange(trimmed)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <EditInput
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    )
  }

  return (
    <EditSpan onClick={startEdit}>
      {value || <Placeholder>{placeholder}</Placeholder>}
    </EditSpan>
  )
}
