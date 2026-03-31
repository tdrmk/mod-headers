import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

const EditSpan = styled.span`
  cursor: text;
  border-radius: 2px;
  min-width: 20px;
  display: inline-block;
  &:hover { background: #F7F7F7; }
`

const Placeholder = styled.span`
  color: #999999;
`

const EditInput = styled.input`
  border: 1px solid #000000;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: inherit;
  font-family: inherit;
  width: 100%;
  outline: none;
  color: inherit;
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
