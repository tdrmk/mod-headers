import styled from 'styled-components'
import { IconBtn, FieldInput } from './Shared.jsx'
import { colors, typography } from '../theme.js'

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
`

const DragHandle = styled.span`
  cursor: grab;
  color: ${colors.contentTertiary};
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  user-select: none;
  &:hover { color: ${colors.contentSecondary}; }
  &:active { cursor: grabbing; }
`

const HeaderName = styled.span`
  flex: 0 0 150px;
  font-size: ${typography.scale300};
  overflow: hidden;
  font-family: ${typography.fontFamily};
`

const HeaderValue = styled.span`
  flex: 1;
  font-size: ${typography.scale300};
  color: ${colors.contentSecondary};
  overflow: hidden;
  font-family: ${typography.fontFamily};
`

export default function HeaderRow({ header, onChange, onDelete, onDragStart, onDragOver, onDrop, isDragging }) {
  return (
    <Row
      $dragging={isDragging}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDrop}
    >
      <DragHandle title="Drag to reorder">⠿</DragHandle>
      <input
        type="checkbox"
        checked={header.enabled}
        disabled={!header.name || !header.value}
        onChange={(e) => onChange({ enabled: e.target.checked })}
      />
      <HeaderName>
        <FieldInput
          value={header.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Header name"
        />
      </HeaderName>
      <HeaderValue>
        <FieldInput
          value={header.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Value"
        />
      </HeaderValue>
      <IconBtn onClick={onDelete} title="Delete">×</IconBtn>
    </Row>
  )
}
