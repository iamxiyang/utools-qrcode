import { ClearOutlined } from '@ant-design/icons'
import { Popconfirm, Button, Input } from 'antd'
import { HistoryItem } from './HistoryItem'
import { useProxy } from 'valtio/utils'
import { state } from '../store'
import { useMemo, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'

export const Side = (props: any) => {
  const [text, setText] = useState('')
  const history = useProxy(state).decodeHistory
  const [parent] = useAutoAnimate()

  const filteredHistory = useMemo(() => {
    try {
      if (!text) return history
      const reg = new RegExp(text)
      return history.filter(item => reg.test(item.text))
    } catch (e) {
      return history
    }
  }, [text, history])

  return (
    <section className="w-30% h-full bg-#f2f2f2 dark:bg-#141414 overflow-hidden px-10px ml-10px rd-6px">
      <header className="flex items-center justify-between h-52px py-10px">
        <strong className="dark:text-#f2f2f2">记录</strong>
        {history.length > 0 && (
          <Popconfirm
            title="确定清空已经保存的历史记录？"
            onConfirm={() => {
              state.decodeHistory = []
            }}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" icon={<ClearOutlined />}></Button>
          </Popconfirm>
        )}
      </header>
      <Input
        style={{
          display: history.length > 0 ? 'block' : 'none',
        }}
        placeholder="搜索记录/支持正则"
        className="mb-12px "
        value={text}
        onChange={e => {
          setText(e.target.value)
        }}
      />
      <div className="overflow-y-auto overflow-x-hidden h-[calc(100%-52px)]" ref={parent}>
        {filteredHistory.map((item, index) => (
          <HistoryItem
            setQrcodeText={props.onGrandchildData}
            key={item.createTime?.toString()}
            index={index}
            {...item}
          />
        ))}
        {history.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-#888 dark:text-#767676">暂无解析记录</p>
          </div>
        )}
      </div>
    </section>
  )
}
