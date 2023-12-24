import { ClearOutlined } from '@ant-design/icons'
import { Popconfirm, Button } from 'antd'
import { HistoryItem } from './HistoryItem'
import { useProxy } from 'valtio/utils'
import { state } from '../store'

export const Side = () => {
  const history = useProxy(state).decodeHistory
  return (
    <section className="w-30% h-full bg-#f2f2f2 dark:bg-#141414 overflow-hidden px-10px ml-10px rd-6px">
      <header className="flex items-center justify-between h-52px py-10px">
        <strong className="dark:text-#f2f2f2">解码历史</strong>
        {history.length > 0 && (
          <Popconfirm
            title="确定清空解析历史记录？"
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
      <div className="overflow-y-auto overflow-x-hidden h-[calc(100%-52px)] p-r-6px">
        {history.map((item, index) => (
          <HistoryItem key={index} text={item} />
        ))}
      </div>
    </section>
  )
}
