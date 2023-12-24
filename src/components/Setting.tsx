import { Drawer, Tooltip, Switch, InputNumber, ColorPicker } from 'antd'
import { useTheme } from '../hooks'
import { useProxy } from 'valtio/utils'
import { state } from '../store'
interface SettingProps {
  onClose: () => void
  open: boolean
}

export const Setting = (props: SettingProps) => {
  const setting = useProxy(state.setting)
  const currentTheme = useTheme()
  return (
    <Drawer title="设置" placement="right" onClose={props.onClose} open={props.open} className={currentTheme}>
      <Tooltip title="开启后二维码解析文本将保存到历史记录，生成的二维码也允许主动保存到记录中" placement="left">
        <h4 className="mt-0 mb-10px dark:text-#d3d3d3">是否保存解析记录</h4>
        <Switch
          checkedChildren="开启"
          unCheckedChildren="关闭"
          onChange={() => {
            if (setting.isSaveHistory) {
              state.decodeHistory = []
            }
            setting.isSaveHistory = !setting.isSaveHistory
          }}
          defaultChecked={setting.isSaveHistory}
        />
      </Tooltip>

      {setting.isSaveHistory && (
        <>
          <Tooltip title="开启后如果历史记录已经存在相同的内容将先删除旧的内容再保存" placement="left">
            <h4 className="mb-10px dark:text-#d3d3d3">保存时是否去重复</h4>
            <Switch
              checkedChildren="开启"
              unCheckedChildren="关闭"
              onChange={() => {
                setting.isRemoveDuplicates = !setting.isRemoveDuplicates
              }}
              defaultChecked={setting.isRemoveDuplicates}
            />
          </Tooltip>{' '}
          <Tooltip title="超出设置条数自动覆盖旧内容" placement="left">
            <h4 className="mb-10px dark:text-#d3d3d3">保留条数</h4>
            <InputNumber
              className="w-full"
              value={setting.saveHistoryMaxCount}
              onChange={value => {
                setting.saveHistoryMaxCount = value || 1
              }}
              min={1}
              max={100}
            />
          </Tooltip>
        </>
      )}

      <Tooltip title="开启后二维码图片解析出来的内容将自动复制到剪贴板" placement="left">
        <h4 className="mb-10px dark:text-#d3d3d3">解码文本自动复制</h4>
        <Switch
          checkedChildren="开启"
          unCheckedChildren="关闭"
          onChange={() => {
            setting.isAutoCopyCode = !setting.isAutoCopyCode
          }}
          defaultChecked={setting.isAutoCopyCode}
        />
      </Tooltip>
      <Tooltip title="开启后生成的二维码图片将自动复制到剪贴板" placement="left">
        <h4 className="mb-10px dark:text-#d3d3d3">二维码图片自动复制</h4>
        <Switch
          checkedChildren="开启"
          unCheckedChildren="关闭"
          onChange={() => {
            setting.isAutoCopyQrcode = !setting.isAutoCopyQrcode
          }}
          defaultChecked={setting.isAutoCopyQrcode}
        />
      </Tooltip>
      <div>
        <h4 className="mb-10px dark:text-#d3d3d3">二维码颜色</h4>
        <ColorPicker
          size="small"
          showText
          defaultValue={setting.qrCodeColor}
          onChange={event => {
            setting.qrCodeColor = event.toHexString()
          }}
        />
      </div>
      <div>
        <h4 className="mb-10px dark:text-#d3d3d3">二维码背景颜色</h4>
        <ColorPicker
          size="small"
          showText
          defaultValue={setting.qrCodeBgColor}
          onChange={event => {
            setting.qrCodeBgColor = event.toHexString()
          }}
        />
      </div>
    </Drawer>
  )
}
