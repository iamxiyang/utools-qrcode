import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Input,
  QRCode,
  FloatButton,
  Drawer,
  Button,
  Switch,
  message,
  ColorPicker,
  Tooltip,
  InputNumber,
  Modal,
  Popconfirm,
} from 'antd'
import {
  MenuOutlined,
  SettingOutlined,
  ScanOutlined,
  CopyOutlined,
  ClearOutlined,
  WechatOutlined,
} from '@ant-design/icons'
import { Setting } from './types'
import { useLocalStorage, useSetting } from './hooks'
import { copyImage, copyText, openUrl } from './utils'
import { scan } from 'qr-scanner-wechat'

const { TextArea } = Input

const initialSetting: Setting = {
  isSaveHistory: true,
  isRemoveDuplicates: false,
  saveHistoryMaxCount: 20,
  isAutoCopyCode: false,
  isAutoCopyQrcode: false,
  // 二维码相关配置
  qrCodeColor: '#000000',
  qrCodeBgColor: '#ffffff',
}

const HistoryItem = ({ text }: { text: string }) => {
  const isUrl = text.startsWith('http')

  const onCopy = () => {
    copyText(text)
    message.success('复制成功')
  }

  const onTextClick = () => {
    if (isUrl) {
      openUrl(text)
    }
  }

  return (
    <div className="min-h-40px bg-#fcfcfc p-4px flex items-center text-14px m-b-8px border-#ddd cursor-text">
      <div className="flex-1">
        <Button
          type={isUrl ? 'link' : 'text'}
          className="p-4px !bg-#fcfcfc text-left history-text"
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

const imgEl = document.createElement('img')

function App() {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  const [setting, updateSetting] = useSetting(initialSetting)
  const [history, updateHistory] = useLocalStorage<string[]>('DecodeHistory', [])

  const [messageApi, messageContextHolder] = message.useMessage()
  const [modal, modealContextHolder] = Modal.useModal()

  useEffect(() => {
    utools.onPluginEnter(({ code, type, payload }) => {
      if (type === 'regex') {
        setText(payload)
        return
      }
      if (type === 'window') {
        setText('')
        window.utools.readCurrentBrowserUrl().then(url => {
          setText(url)
        })
        return
      }
      if (type === 'img') {
        parseImg(payload)
        return
      }
      if (payload.includes('扫码') || payload.includes('截图')) {
        onScan()
      }
    })
  }, [])

  const timer: any = useRef(null)

  const onTextAreaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      timer.value && clearTimeout(timer.value)
      const value = event.target.value
      setText(value)
      if (value.trim().length && setting.isAutoCopyQrcode) {
        timer.value = setTimeout(() => {
          copyQrcode()
          messageApi.success('自动复制成功')
        }, 1000)
      }
    },
    [setting.isAutoCopyQrcode],
  )

  const copyQrcode = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) return
    copyImage(canvas.toDataURL('image/png'))
  }

  const onCopyQrcode = () => {
    copyQrcode()
    messageApi.success('复制成功')
  }

  const appendHistory = useCallback(
    (text: string) => {
      let newArr = [text, ...history]
      if (setting.isRemoveDuplicates) {
        newArr = [...new Set(newArr)]
      }
      if (newArr.length >= setting.saveHistoryMaxCount) {
        newArr.pop()
      }
      updateHistory(newArr)
    },
    [history, setting.saveHistoryMaxCount, setting.isRemoveDuplicates],
  )

  const parseImg = async (base64Str: string) => {
    imgEl.onload = async () => {
      const { text } = await scan(imgEl)
      if (text) {
        setText(text)
        if (setting.isAutoCopyCode) {
          copyText(text)
          message.success('解析成功，自动复制成功')
        } else {
          message.success('解析成功')
        }
        if (setting.isSaveHistory) {
          appendHistory(text)
        }
      } else {
        message.error('未识别到二维码')
      }
    }
    imgEl.src = base64Str
  }

  const onScan = async () => {
    window.utools.screenCapture(parseImg)
  }

  const onShowContact = () => {
    const GIT_URL = 'https://github.com/iamxiyang/utools-qrcode'
    modal.info({
      title: '联系/打赏作者',
      width: 580,
      centered: true,
      icon: null,
      okText: '关闭',
      content: (
        <>
          <div className="w-530px flex items-center justify-between mt-20px">
            <div>
              <img src="./wechat.jpg" className="w-250px" alt="联系作者" />
              <p className="text-center mt-4px">微信扫码联系作者</p>
            </div>
            <div>
              <img src="./appreciate.jpg" className="w-250px" alt="赞赏作者" />
              <p className="text-center mt-4px">微信扫码支持开发</p>
            </div>
          </div>
          <div>
            该插件开源，开源地址
            <Button type="link" onClick={() => openUrl(GIT_URL)}>
              {GIT_URL}
            </Button>
          </div>
          <p className="mt-4px">如有问题、建议，可以直接微信联系，或者通过github提issue、插件评论区留言</p>
        </>
      ),
    })
  }

  return (
    <div className="w-full h-full flex p-20px">
      {messageContextHolder}
      {modealContextHolder}
      <div className="flex-1 flex flex-col">
        <div className="h-160px">
          <TextArea
            autoFocus
            value={text}
            maxLength={1000}
            className="!h-full"
            style={{ resize: 'none' }}
            onChange={onTextAreaChange}
            placeholder="二维码内容"
          />
        </div>
        <div className="flex-1 flex items-center justify-center  mt-30px">
          <Tooltip title="点击复制二维码" placement="top">
            <div className="qrcode-container" onClick={onCopyQrcode}>
              <QRCode
                size={3000}
                bordered={false}
                color={setting.qrCodeColor}
                bgColor={setting.qrCodeBgColor}
                value={text || 'wxp://f2f1T_ktr-V8a3MBhU6ICGoMp01a6LqJeBOmVGEFy8JE_8JauFt8Nh-3NP32iK3WEtYf'}
              />
            </div>
          </Tooltip>
        </div>
      </div>
      {setting.isSaveHistory && (
        <section className="w-30% h-full bg-#f2f2f2 overflow-y-auto overflow-x-hidden px-10px ml-10px rd-6px">
          <header className="flex items-center justify-between h-52px py-10px">
            <strong>解码历史</strong>
            {history.length > 0 && (
              <Popconfirm
                title="确定清空解析历史记录？"
                onConfirm={() => updateHistory([])}
                okText="删除"
                cancelText="取消"
              >
                <Button type="link" icon={<ClearOutlined />}></Button>
              </Popconfirm>
            )}
          </header>
          <div>
            {history.map(item => (
              <HistoryItem key={item} text={item} />
            ))}
          </div>
        </section>
      )}

      <FloatButton.Group trigger="hover" style={{ right: 30 }} icon={<MenuOutlined />}>
        <FloatButton icon={<ScanOutlined />} tooltip="扫码" onClick={onScan} />
        <FloatButton icon={<SettingOutlined />} tooltip="设置" onClick={() => setOpen(true)} />
        <FloatButton icon={<WechatOutlined />} tooltip="联系作者/打赏" onClick={onShowContact} />
      </FloatButton.Group>

      <Drawer title="设置" placement="right" onClose={() => setOpen(false)} open={open}>
        <Tooltip title="开启后二维码解析文本将保存到历史记录" placement="left">
          <h4 className="mt-0 mb-10px">是否保存解析历史</h4>
          <Switch
            checkedChildren="开启"
            unCheckedChildren="关闭"
            onChange={() => {
              if (setting.isSaveHistory) {
                updateHistory([])
              }
              updateSetting({ isSaveHistory: !setting.isSaveHistory })
            }}
            defaultChecked={setting.isSaveHistory}
          />
        </Tooltip>

        {setting.isSaveHistory && (
          <>
            <Tooltip title="开启后如果历史记录已经存在相同的内容将先删除旧的内容再保存" placement="left">
              <h4 className="mb-10px">保存时是否去重复</h4>
              <Switch
                checkedChildren="开启"
                unCheckedChildren="关闭"
                onChange={() => updateSetting({ isRemoveDuplicates: !setting.isRemoveDuplicates })}
                defaultChecked={setting.isRemoveDuplicates}
              />
            </Tooltip>{' '}
            <Tooltip title="超出设置条数自动覆盖旧内容" placement="left">
              <h4 className="mb-10px">保留条数</h4>
              <InputNumber
                className="w-full"
                value={setting.saveHistoryMaxCount}
                onChange={value => updateSetting({ saveHistoryMaxCount: value || 1 })}
                min={1}
                max={100}
              />
            </Tooltip>
          </>
        )}

        <Tooltip title="开启后二维码图片解析出来的内容将自动复制到剪贴板" placement="left">
          <h4 className="mb-10px">解码文本自动复制</h4>
          <Switch
            checkedChildren="开启"
            unCheckedChildren="关闭"
            onChange={() => updateSetting({ isAutoCopyCode: !setting.isAutoCopyCode })}
            defaultChecked={setting.isAutoCopyCode}
          />
        </Tooltip>
        <Tooltip title="开启后生成的二维码图片将自动复制到剪贴板" placement="left">
          <h4 className="mb-10px">二维码图片自动复制</h4>
          <Switch
            checkedChildren="开启"
            unCheckedChildren="关闭"
            onChange={() => updateSetting({ isAutoCopyQrcode: !setting.isAutoCopyQrcode })}
            defaultChecked={setting.isAutoCopyQrcode}
          />
        </Tooltip>
        <div>
          <h4 className="mb-10px">二维码颜色</h4>
          <ColorPicker
            size="small"
            showText
            defaultValue={setting.qrCodeColor}
            onChange={event => {
              updateSetting({ qrCodeColor: event.toHexString() })
            }}
          />
        </div>
        <div>
          <h4 className="mb-10px">二维码背景颜色</h4>
          <ColorPicker
            size="small"
            showText
            defaultValue={setting.qrCodeBgColor}
            onChange={event => {
              updateSetting({ qrCodeBgColor: event.toHexString() })
            }}
          />
        </div>
      </Drawer>
    </div>
  )
}

export default App
