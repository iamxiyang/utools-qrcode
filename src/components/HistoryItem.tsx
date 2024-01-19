import { App, Button, Tooltip, Dropdown } from 'antd'
import { copyText, formatTime, openUrl } from '../utils'
import { History } from '../types/types'
import { state } from '../store'
import { useContext } from 'react'
import { historyItemContext } from '../App'
import { CopyOutlined, EllipsisOutlined, RedoOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

export const HistoryItem = ({ text, createTime, index }: History & { index: number }) => {
  const setText = useContext(historyItemContext)
  const { message } = App.useApp()
  const isUrl = /^(https?|ftp):\/\/.*/.test(text)
  const onCopy = () => {
    copyText(text)
    message.success({
      content: '复制成功',
      duration: 1,
    })
  }

  const onLinkButton = () => {
    if (isUrl) {
      openUrl(text)
    }
  }

  const onDelete = () => {
    const list = state.decodeHistory
    list.splice(index, 1)
    state.decodeHistory = [...list]
  }

  const onCreateQRcode = () => {
    setText(text)
  }

  const items: MenuProps['items'] = [
    {
      style: { width: '80px', textAlign: 'center' },
      label: (
        <a onClick={onCopy}>
          <CopyOutlined className="w-12px" />
          &nbsp;复制
        </a>
      ),
      key: 'copy',
    },
    {
      style: { width: '80px', textAlign: 'center' },
      label: (
        <a onClick={onCreateQRcode}>
          <RedoOutlined className="w-12px" />
          &nbsp;生成
        </a>
      ),
      key: 'create',
    },
    {
      style: { width: '80px', textAlign: 'center' },
      label: (
        <a onClick={onDelete} style={{ color: 'red' }}>
          <DeleteOutlined className="w-12px" />
          &nbsp;删除
        </a>
      ),
      key: 'delete',
    },
    {
      style: { width: '80px', textAlign: 'center' },
      label: (
        <a onClick={onLinkButton}>
          <LinkOutlined className="w-12px" />
          &nbsp;打开
        </a>
      ),
      key: 'open',
      disabled: isUrl ? false : true,
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['contextMenu']}>
      <div className="group overflow-hidden relative b-rd-4px min-h-40px bg-#fcfcfc dark:bg-#303133 p-4px flex items-center text-14px m-b-8px border-#ddd cursor-text">
        <div className="flex-1">
          <Button
            type={isUrl ? 'link' : 'text'}
            className="px-4px py-2px !bg-#fcfcfc !dark:bg-#303133 text-left history-text"
            onClick={onLinkButton}
          >
            {text}
          </Button>
          {createTime && (
            <p className="px-4px py-2px m-0 text-#888 dark:text-#767676 text-12px">{formatTime(createTime)}</p>
          )}
        </div>
        <Tooltip title="复制" placement="left">
          <Button size="small" icon={<CopyOutlined className="cursor-pointer" />} type="text" onClick={onCopy}></Button>
        </Tooltip>
        <Dropdown menu={{ items }} trigger={['click']}>
          <Tooltip title="更多" placement="left">
            <Button size="small" icon={<EllipsisOutlined className="cursor-pointer" />} type="text"></Button>
          </Tooltip>
        </Dropdown>
      </div>
    </Dropdown>
  )
}
