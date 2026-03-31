import { useState } from 'react'
import styled from 'styled-components'
import InlineEdit from './InlineEdit.jsx'
import { IconBtn, TextBtn, FieldInput, DeleteConfirm } from './Shared.jsx'

const Card = styled.div`
  border: 1px solid #E2E2E2;
  border-radius: 6px;
  padding: 0 0 8px;
  margin-bottom: 10px;
`

const CollapsedWrapper = styled.div`
  margin-bottom: 2px;
  border: 1px solid transparent;
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 4px 12px;
`

const Toggle = styled.span`
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  line-height: 1;
`

const CardName = styled.span`
  flex: 1;
  margin: 0 8px;
  font-weight: 500;
  font-size: 14px;
`

const CardDescription = styled.div`
  font-size: 12px;
  color: #757575;
  margin-bottom: 8px;
  min-height: 16px;
  padding: 0 12px;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 12px;
`

const GroupHeaderName = styled.span`
  flex: 0 0 130px;
  font-size: 13px;
  overflow: hidden;
`

const GroupHeaderValue = styled.span`
  flex: 1;
  font-size: 13px;
  color: #545454;
  overflow: hidden;
`

export default function GroupCard({ group, onUpdate, onDelete, onAddHeader, onUpdateHeader, onDeleteHeader }) {
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <CollapsedWrapper>
        <CardHeader>
          <Toggle onClick={() => setExpanded(true)}>+</Toggle>
          <CardName>
            <span style={{ cursor: 'pointer' }} onClick={() => setExpanded(true)}>
              {group.name || <span style={{ color: '#999999' }}>Unnamed group</span>}
            </span>
          </CardName>
        </CardHeader>
      </CollapsedWrapper>
    )
  }

  return (
    <Card>
      <CardHeader>
        <Toggle onClick={() => setExpanded(false)}>−</Toggle>
        <CardName>
          <InlineEdit
            value={group.name}
            onChange={(v) => onUpdate({ name: v })}
            placeholder="Group name"
          />
        </CardName>
        <DeleteConfirm label={`Delete "${group.name}"?`} onDelete={onDelete} />
      </CardHeader>

      <CardDescription>
        <InlineEdit
          value={group.description}
          onChange={(v) => onUpdate({ description: v })}
          placeholder="Add a description"
        />
      </CardDescription>

      {group.headers.map((header) => (
        <HeaderRow key={header.id}>
          <GroupHeaderName>
            <FieldInput
              value={header.name}
              onChange={(e) => onUpdateHeader(header.id, { name: e.target.value })}
              placeholder="Header name"
            />
          </GroupHeaderName>
          <GroupHeaderValue>
            <FieldInput
              value={header.value}
              onChange={(e) => onUpdateHeader(header.id, { value: e.target.value })}
              placeholder="Value"
            />
          </GroupHeaderValue>
          <IconBtn onClick={() => onDeleteHeader(header.id)} title="Delete">×</IconBtn>
        </HeaderRow>
      ))}

      <TextBtn style={{ paddingLeft: 12, marginTop: 6 }} onClick={onAddHeader}>+ Add Header</TextBtn>
    </Card>
  )
}
