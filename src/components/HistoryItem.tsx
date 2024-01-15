import { App, Button, Tooltip } from 'antd'
import { copyText, formatTime, openUrl } from '../utils'
import { History } from '../types/types'
import { state } from '../store'

export const HistoryItem = ({ text, createTime, index, setQrcodeText }: History & { index: number } & { setQrcodeText: Function }) => {
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
    const list = state.decodeHistory;
    list.splice(index, 1);
    state.decodeHistory= [...list];
  }

  const onCreateQRcode = () => {
    setQrcodeText(text);
  }

  return (
    <div className={`group overflow-hidden relative b-rd-4px min-h-40px bg-#fcfcfc dark:bg-#303133 p-4px flex items-center text-14px m-b-8px border-#ddd cursor-text`}>
      <div className="flex-1">
        <Button
          type={isUrl ? 'link' : 'text'}
          className="px-4px py-2px !bg-#fcfcfc !dark:bg-#303133 text-left history-text"
        >
          {text}
        </Button>
        {createTime && (
          <p className="px-4px py-2px m-0 text-#888 dark:text-#767676 text-12px">{formatTime(createTime)}</p>
        )}
      </div>
      <div className='absolute flex items-center justify-center w-100% h-100% left-0 top-0 opacity-0 bg-[rgba(0,0,0,.6)] group-hover:opacity-100 transition-all transition-500! '>
        <Tooltip title="复制" placement="top">
          <Button className='tracking-2px text-#fff hover:text-#333! hover:bg-#fff!' size="small" type="text" onClick={onCopy}>复制</Button>
        </Tooltip>
        <Tooltip title="生成二维码" placement="top">
          <Button className='tracking-2px color-#fff hover:text-#333! hover:bg-#fff!' size="small" type="text" onClick={onCreateQRcode}>生成</Button>
        </Tooltip>
        <Tooltip title={isUrl ? '打开链接' : '链接才能打开'} placement="top">
          <Button className='tracking-2px color-#fff hover:text-#333! hover:bg-#fff!' size="small" type="text" onClick={onLinkButton}>打开</Button>
        </Tooltip>
        <Tooltip title="删除" placement="top">
          <Button className='tracking-2px color-#fff hover:text-red! hover:bg-#fff!' size="small" type="text" onClick={onDelete}>删除</Button>
        </Tooltip>
      </div>
    </div>
  )
}
