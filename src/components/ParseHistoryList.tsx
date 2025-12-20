import React, { useMemo, useCallback, useState } from 'react'
import { Button, App, Tooltip, Input, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { 
  CopyOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  EditOutlined,
  QrcodeOutlined,
} from '@ant-design/icons'
import { state, deleteHistory, updateHistoryRemark } from '../store'
import { useProxy } from 'valtio/utils'
import { History as HistoryType } from '../types/types'
import { truncateText, copyText, detectQRCodeType, parseContentToFormData } from '../utils'

interface ParseHistoryListProps {
  onSelect: (item: HistoryType) => void
  recentMinutes?: number
  maxItems?: number
  title?: string
}

const ParseHistoryItem = React.memo<{
  item: HistoryType
  onSelect: (item: HistoryType) => void
  onCopy: (text: string, e?: React.MouseEvent) => void
  onDelete: (id: string, e?: React.MouseEvent) => void
  contextMenu: MenuProps['items']
}>(({ item, onSelect, onCopy, onDelete, contextMenu }) => {
  const typeInfo = detectQRCodeType(item.text)
  
  return (
    <Dropdown
      menu={{ items: contextMenu }}
      trigger={['contextMenu']}
    >
      <div
        className="group flex items-center gap-3 px-4 py-3 bg-bg-secondary rounded-md cursor-pointer transition-all border border-border-light hover:bg-primary-light hover:border-primary/30"
        onClick={() => onSelect(item)}
      >
        <span className="text-sm opacity-40 shrink-0">{typeInfo.icon}</span>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {item.remark ? (
            <>
              <span className="text-sm text-text font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                {truncateText(item.remark, 40)}
              </span>
              <span className="text-sm text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap font-mono">
                {truncateText(item.text, 60)}
              </span>
            </>
          ) : (
            <span className="text-sm text-text overflow-hidden text-ellipsis whitespace-nowrap font-mono">
              {truncateText(item.text, 80)}
            </span>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity shrink-0 group-hover:opacity-100">
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => onCopy(item.text, e)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => onDelete(item.id, e)}
            />
          </Tooltip>
        </div>
      </div>
    </Dropdown>
  )
})

export const ParseHistoryList: React.FC<ParseHistoryListProps> = ({ 
  onSelect, 
  recentMinutes,
  maxItems = 10,
  title = '最近解析'
}) => {
  const { message, modal } = App.useApp()
  const stateProxy = useProxy(state)
  const history = stateProxy.history
  const setting = stateProxy.setting

  const [searchText, setSearchText] = useState('')

  const parseHistory = useMemo(() => {
    let filtered = history.filter(item => item.type === 'parse')
    
    if (recentMinutes) {
      const cutoffTime = Date.now() - recentMinutes * 60 * 1000
      filtered = filtered.filter(item => item.createTime > cutoffTime)
    }
    
    if (searchText) {
      try {
        const reg = new RegExp(searchText, 'i')
        filtered = filtered.filter(item => 
          reg.test(item.text) || (item.remark && reg.test(item.remark))
        )
      } catch {
        const lowerSearch = searchText.toLowerCase()
        filtered = filtered.filter(item => 
          item.text.toLowerCase().includes(lowerSearch) ||
          (item.remark && item.remark.toLowerCase().includes(lowerSearch))
        )
      }
    }
    
    return filtered.slice(0, maxItems)
  }, [history, recentMinutes, maxItems, searchText])

  const handleCopy = useCallback((text: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    copyText(text)
    message.success('已复制')
  }, [message])

  const handleDelete = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    deleteHistory(id)
  }, [])

  const handleAddRemark = useCallback((item: HistoryType) => {
    let remarkValue = item.remark || ''
    
    modal.confirm({
      title: '添加备注',
      icon: <EditOutlined />,
      content: (
        <Input.TextArea
          defaultValue={remarkValue}
          placeholder="输入备注内容..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          onChange={(e) => { remarkValue = e.target.value }}
        />
      ),
      okText: '保存',
      cancelText: '取消',
      onOk: () => {
        updateHistoryRemark(item.id, remarkValue)
        message.success('备注已保存')
      },
    })
  }, [modal, message])

  const handleGoGenerate = useCallback((item: HistoryType) => {
    const formData = parseContentToFormData(item.text)
    state.mode = 'generate'
    Object.assign(state.generateForm, formData)
  }, [])

  const getContextMenu = useCallback((item: HistoryType): MenuProps['items'] => [
    {
      key: 'copy',
      label: '复制内容',
      icon: <CopyOutlined />,
      onClick: () => handleCopy(item.text),
    },
    {
      key: 'generate',
      label: '生成二维码',
      icon: <QrcodeOutlined />,
      onClick: () => handleGoGenerate(item),
    },
    {
      type: 'divider',
    },
    {
      key: 'remark',
      label: item.remark ? '编辑备注' : '添加备注',
      icon: <EditOutlined />,
      onClick: () => handleAddRemark(item),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(item.id),
    },
  ], [handleCopy, handleGoGenerate, handleAddRemark, handleDelete])

  if (!setting.isSaveHistory) {
    return null
  }

  const allParseHistoryCount = history.filter(item => item.type === 'parse').length

  return (
    <div className="mt-8 pt-6 border-t border-border-light  mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-text">{title}</span>
        <span className="text-xs text-text-tertiary">
          {searchText ? `${parseHistory.length} / ` : ''}{allParseHistoryCount} 条
        </span>
      </div>

      {allParseHistoryCount > 3 && (
        <div className="mb-3">
          <Input
            placeholder="搜索内容或备注，支持正则..."
            prefix={<SearchOutlined className="text-text-tertiary" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="small"
          />
        </div>
      )}

      {parseHistory.length === 0 ? (
        <div className="text-center py-6 text-text-tertiary text-sm">
          {allParseHistoryCount === 0 ? '暂无解析历史' : '无匹配结果'}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {parseHistory.map((item) => (
            <ParseHistoryItem
              key={item.id}
              item={item}
              onSelect={onSelect}
              onCopy={handleCopy}
              onDelete={handleDelete}
              contextMenu={getContextMenu(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
