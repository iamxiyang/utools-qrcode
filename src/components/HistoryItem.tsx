import { App, Button, Tooltip, Dropdown } from 'antd'
import { copyText, formatTime, openUrl } from '../utils'
import { History } from '../types/types'
import { state } from '../store'
import { useContext } from 'react'
import { historyItemContext } from '../App'
import { CopyOutlined, RedoOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

interface HistoryItemProps extends History {
  index: number
}

export const HistoryItem = ({ text, createTime, index }: HistoryItemProps) => {
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
      label: (
        <Button block type="text" icon={<CopyOutlined />} onClick={onCopy}>
          复制
        </Button>
      ),
      key: 'copy',
    },
    {
      label: (
        <Button block type="text" icon={<RedoOutlined />} onClick={onCreateQRcode}>
          生成
        </Button>
      ),
      key: 'create',
    },
    {
      label: (
        <Button block type="text" danger icon={<DeleteOutlined />} onClick={onDelete}>
          删除
        </Button>
      ),
      key: 'delete',
    },
    isUrl
      ? {
          label: (
            <Button block type="link" icon={<LinkOutlined />} onClick={onLinkButton}>
              打开
            </Button>
          ),
          key: 'open',
        }
      : null,
  ]

  return (
    <Dropdown menu={{ items }} trigger={['contextMenu']}>
      <div className="overflow-hidden relative b-rd-4px min-h-40px bg-#fcfcfc dark:bg-#303133 p-4px flex items-center text-14px m-b-8px border-#ddd cursor-text">
        <div className="flex-1">
          <Button
            type={isUrl ? 'link' : 'text'}
            className="px-4px py-2px !bg-#fcfcfc !dark:bg-#303133 text-left history-text all-select-text"
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
      </div>
    </Dropdown>
  )
}
