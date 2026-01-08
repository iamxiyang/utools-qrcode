import { Drawer, Switch, InputNumber, Button, App, Radio } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useProxy } from 'valtio/utils'
import { state, clearHistory } from '../store'

interface SettingProps {
  onClose: () => void
  open: boolean
}

export const Setting = (props: SettingProps) => {
  const { message } = App.useApp()
  const { setting, history } = useProxy(state)
  
  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <SettingOutlined />
          <span>设置</span>
        </div>
      }
      placement="right"
      onClose={props.onClose}
      open={props.open}
      size="default"
    >
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
          历史记录
        </h4>
        
        <div className="flex justify-between items-center py-3 border-b border-border-light">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text">保存历史记录</span>
            <span className="text-xs text-text-tertiary">解析和生成的内容将被保存</span>
          </div>
          <Switch
            checked={setting.isSaveHistory}
            onChange={(checked) => {
              if (!checked) {
                clearHistory()
              }
              state.setting.isSaveHistory = checked
            }}
          />
        </div>

        {setting.isSaveHistory && (
          <>
            <div className="flex justify-between items-center py-3 border-b border-border-light">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text">自动去重</span>
                <span className="text-xs text-text-tertiary">相同内容只保留最新一条</span>
              </div>
              <Switch
                checked={setting.isRemoveDuplicates}
                onChange={(checked) => {
                  state.setting.isRemoveDuplicates = checked
                }}
              />
            </div>

            <div className="flex justify-between items-center py-3 border-b border-border-light">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-text">最大保留条数</span>
              </div>
              <InputNumber
                value={setting.maxHistoryCount}
                onChange={(value) => {
                  state.setting.maxHistoryCount = value || 50
                }}
                min={5}
                max={200}
                size="small"
                className="w-20"
              />
            </div>
          </>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
          自动复制
        </h4>
        
        <div className="flex justify-between items-center py-3 border-b border-border-light">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text">解析后自动复制</span>
            <span className="text-xs text-text-tertiary">自动复制解析结果到剪贴板</span>
          </div>
          <Switch
            checked={setting.isAutoCopyParseResult}
            onChange={(checked) => {
              state.setting.isAutoCopyParseResult = checked
            }}
          />
        </div>

        <div className="flex justify-between items-center py-3 border-b border-border-light">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text">生成后自动复制</span>
            <span className="text-xs text-text-tertiary">自动复制二维码图片到剪贴板</span>
          </div>
          <Switch
            checked={setting.isAutoCopyQRCode}
            onChange={(checked) => {
              state.setting.isAutoCopyQRCode = checked
            }}
          />
        </div>
      </div>



      <div className="mb-6">
        <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
          二维码样式
        </h4>
        
        <div className="flex justify-between items-center py-3 border-b border-border-light">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text">默认下载格式</span>
          </div>
          <Radio.Group 
            value={setting.defaultDownloadFormat}
            onChange={(e) => state.setting.defaultDownloadFormat = e.target.value}
            size="small"
            optionType="button"
          >
            <Radio.Button value="png">PNG</Radio.Button>
            <Radio.Button value="svg">SVG</Radio.Button>
          </Radio.Group>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-border-light">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text">前景颜色</span>
          </div>
          <input
            type="color"
            value={setting.qrCodeColor}
            onChange={(e) => {
              state.setting.qrCodeColor = e.target.value
            }}
            className="w-10 h-8 p-1 border-2 border-border rounded-sm cursor-pointer bg-transparent"
          />
        </div>

        <div className="flex justify-between items-center py-3 border-b border-border-light last:border-none">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text">背景颜色</span>
          </div>
          <input
            type="color"
            value={setting.qrCodeBgColor}
            onChange={(e) => {
              state.setting.qrCodeBgColor = e.target.value
            }}
            className="w-10 h-8 p-1 border-2 border-border rounded-sm cursor-pointer bg-transparent"
          />
        </div>
      </div>

      {setting.isSaveHistory && history.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
            数据管理
          </h4>
          
          <div className="flex items-center py-3">
            <Button
              danger
              size="small"
              onClick={() => {
                clearHistory()
                message.success('已清空历史记录')
              }}
            >
              清空历史记录 ({history.length} 条)
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
