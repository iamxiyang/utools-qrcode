import React, { useMemo, useState, useCallback } from 'react'
import { Drawer, Button, Input, App, Popconfirm, Tag, Tooltip } from 'antd'
import {
  SearchOutlined,
  DeleteOutlined,
  ClearOutlined,
  CopyOutlined,
  RedoOutlined,
  HistoryOutlined,
  InboxOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { state, clearHistory, deleteHistory, updateHistoryRemark } from '../store'
import { useProxy } from 'valtio/utils'
import { History as HistoryType } from '../types/types'
import { truncateText, copyText, detectQRCodeType, formatTime, parseContentToFormData } from '../utils'

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
  onSelect: (item: HistoryType) => void
}

const HistoryItem = React.memo<{
  item: HistoryType
  onRegenerate: (item: HistoryType, e: React.MouseEvent) => void
  onCopy: (text: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onEditRemark: (item: HistoryType, e: React.MouseEvent) => void
}>(({ item, onRegenerate, onCopy, onDelete, onEditRemark }) => {
  const typeInfo = detectQRCodeType(item.text)
  
  return (
    <div
      className="group p-3 rounded-md cursor-pointer transition-all mb-1.5 bg-bg-tertiary border border-transparent flex flex-col gap-2 hover:bg-primary-light hover:border-primary/30"
      onClick={(e) => onRegenerate(item, e)}
    >
      {item.remark && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-primary overflow-hidden text-ellipsis whitespace-nowrap">
            {item.remark}
          </span>
        </div>
      )}
      
      <div className="text-sm leading-relaxed text-text break-all line-clamp-3 font-mono">
        {truncateText(item.text, 150)}
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary flex-wrap flex-1 min-w-0">
          <span className="opacity-60">{typeInfo.icon}</span>
          <span className="text-text-secondary">{typeInfo.label}</span>
          <span className="opacity-30">·</span>
          <span>{formatTime(item.createTime)}</span>
          <span className="opacity-30">·</span>
          <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${
            item.type === 'parse' 
              ? 'bg-success-bg text-success' 
              : 'bg-info-bg text-info'
          }`}>
            {item.type === 'parse' ? '解析' : '生成'}
          </span>
        </div>
        
        <div className="flex gap-0.5 opacity-0 transition-opacity shrink-0 group-hover:opacity-100">
          <Tooltip title="备注">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => onEditRemark(item, e)}
              className="!w-[26px] !h-[26px] !min-w-0"
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => onCopy(item.text, e)}
              className="!w-[26px] !h-[26px] !min-w-0"
            />
          </Tooltip>
          <Tooltip title="再生成">
            <Button
              type="text"
              size="small"
              icon={<RedoOutlined />}
              onClick={(e) => onRegenerate(item, e)}
              className="!w-[26px] !h-[26px] !min-w-0"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => onDelete(item.id, e)}
              className="!w-[26px] !h-[26px] !min-w-0"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  )
})

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ open, onClose, onSelect }) => {
  const { message, modal } = App.useApp()
  const stateProxy = useProxy(state)
  const history = stateProxy.history
  const setting = stateProxy.setting

  const [searchText, setSearchText] = useState('')

  const filteredHistory = useMemo(() => {
    if (!searchText) return history
    try {
      const reg = new RegExp(searchText, 'i')
      return history.filter(item => 
        reg.test(item.text) || (item.remark && reg.test(item.remark))
      )
    } catch {
      const lower = searchText.toLowerCase()
      return history.filter(item => 
        item.text.toLowerCase().includes(lower) ||
        (item.remark && item.remark.toLowerCase().includes(lower))
      )
    }
  }, [history, searchText])

  const handleCopy = useCallback((text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    copyText(text)
    message.success('已复制')
  }, [message])

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteHistory(id)
    message.success('已删除')
  }, [message])

  const handleRegenerate = useCallback((item: HistoryType, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const formData = parseContentToFormData(item.text)
    
    state.mode = 'generate'
    Object.assign(state.generateForm, formData)
    
    onClose()
  }, [onClose])

  const handleEditRemark = useCallback((item: HistoryType, e: React.MouseEvent) => {
    e.stopPropagation()
    
    let remarkValue = item.remark || ''
    
    modal.confirm({
      title: '编辑备注',
      icon: null,
      content: (
        <div className="mt-4 pb-4">
          <Input.TextArea
            defaultValue={remarkValue}
            placeholder="输入备注，方便查找..."
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={100}
            showCount
            className="mb-3"
            onChange={(e) => { remarkValue = e.target.value }}
          />
        </div>
      ),
      okText: '保存',
      cancelText: '取消',
      onOk: () => {
        updateHistoryRemark(item.id, remarkValue.trim())
        message.success('备注已更新')
      },
    })
  }, [modal, message])

  const handleClearAll = useCallback(() => {
    clearHistory()
    message.success('已清空')
  }, [message])

  if (!setting.isSaveHistory) {
    return null
  }

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <HistoryOutlined />
          <span>历史记录</span>
          <Tag color="default" className="ml-1 font-normal">
            {history.length}
          </Tag>
        </div>
      }
      placement="right"
      size="default"
      open={open}
      onClose={onClose}
      extra={
        history.length > 0 && (
          <Popconfirm
            title="确定清空所有历史记录？"
            onConfirm={handleClearAll}
            okText="清空"
            cancelText="取消"
          >
            <Button type="text" size="small" icon={<ClearOutlined />} danger>
              清空
            </Button>
          </Popconfirm>
        )
      }
    >
      <div className="h-full flex flex-col">
        {history.length > 3 && (
          <div className="pb-3 border-b border-border-light">
            <Input
              placeholder="搜索内容或备注，支持正则..."
              prefix={<SearchOutlined className="text-text-tertiary" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="rounded-full bg-bg-secondary"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-text-tertiary">
              <InboxOutlined className="text-[48px] mb-3 opacity-50" />
              <span>{history.length === 0 ? '暂无历史记录' : '无匹配结果'}</span>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onRegenerate={handleRegenerate}
                onCopy={handleCopy}
                onDelete={handleDelete}
                onEditRemark={handleEditRemark}
              />
            ))
          )}
        </div>
      </div>
    </Drawer>
  )
}
