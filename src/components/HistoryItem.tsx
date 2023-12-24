import { App, Button, Tooltip } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { copyText, openUrl } from '../utils'

export const HistoryItem = ({ text }: { text: string }) => {
  const { message } = App.useApp()
  const isUrl = /^(https?|ftp):\/\/.*/.test(text)

  const onCopy = () => {
    copyText(text)
    message.success({
      content: '复制成功',
      duration: 1,
    })
  }

  const onTextClick = () => {
    if (isUrl) {
      openUrl(text)
    }
  }

  return (
    <div className="min-h-40px bg-#fcfcfc dark:bg-#303133 p-4px flex items-center text-14px m-b-8px border-#ddd cursor-text">
      <div className="flex-1">
        <Button
          type={isUrl ? 'link' : 'text'}
          className="p-4px !bg-#fcfcfc !dark:bg-#303133 text-left history-text"
          onClick={onTextClick}
        >
          {text}
        </Button>
      </div>
      <Tooltip title="复制" placement="left">
        <Button size="small" icon={<CopyOutlined className="cursor-pointer" />} type="text" onClick={onCopy}></Button>
      </Tooltip>
    </div>
  )
}
