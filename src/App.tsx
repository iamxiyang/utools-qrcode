import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Input, QRCode, FloatButton, Tooltip, ConfigProvider, theme, App, Button } from 'antd'
import { MenuOutlined, SettingOutlined, ScanOutlined, WechatOutlined } from '@ant-design/icons'
import { useTheme } from './hooks'
import { copyImage, copyText } from './utils'
import { scan } from 'qr-scanner-wechat'
import { Contact } from './components/Contact'
import { Side } from './components/Side'
import { Setting } from './components/Setting'
import { useProxy } from 'valtio/utils'
import { state } from './store'
import { History } from './types/types'

const { TextArea } = Input

const imgEl = document.createElement('img')

const ThemeMap = {
  dark: theme.darkAlgorithm,
  light: theme.defaultAlgorithm,
}

function HomePage() {
  const currentTheme = useTheme()
  const { message, modal } = App.useApp()

  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  const setting = useProxy(state.setting)
  const history = useProxy(state.decodeHistory)

  const [isOpenFloatButton, setIsOpenFloatButton] = useState(!!setting.isShowFloatButton)

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
      if (type === 'files') {
        window.preload?.fileToBase64(payload[0].path).then(parseImg)
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
          message.success({
            content: '自动复制成功',
            duration: 1,
          })
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
    message.success({
      content: '复制成功',
      duration: 1,
    })
  }

  const appendHistory = (text: string) => {
    if (!text) return
    let newArr = [{ text, createTime: Date.now() }, ...state.decodeHistory]
    if (setting.isRemoveDuplicates) {
      newArr = newArr.filter((item: History, index: number, arr: History[]) => {
        return arr.findIndex((item2: History) => item2.text === item.text) === index
      })
    }
    if (newArr.length >= setting.saveHistoryMaxCount) {
      newArr = newArr.slice(0, setting.saveHistoryMaxCount)
    }
    state.decodeHistory = newArr
  }

  const parseImg = async (base64Str: string) => {
    imgEl.onload = async () => {
      try {
        const { text } = await scan(imgEl)
        if (text) {
          setText(text)
          if (setting.isAutoCopyCode) {
            copyText(text)
            message.success({
              content: '解析成功，自动复制成功',
              duration: 1,
            })
          } else {
            message.success({
              content: '解析成功',
              duration: 1,
            })
          }
          if (setting.isSaveHistory) {
            appendHistory(text)
          }
        } else {
          message.error({
            content: '未识别到二维码',
            duration: 1,
          })
        }
      } catch (err) {
        message.error({
          content: '未识别到二维码-2',
          duration: 1,
        })
      }
    }
    imgEl.src = base64Str
  }

  const onScan = async () => {
    window.utools.screenCapture(parseImg)
  }

  const onShowContact = () => {
    modal.info({
      title: '联系/打赏作者',
      width: 580,
      centered: true,
      icon: null,
      okText: '关闭',
      content: Contact,
    })
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: ThemeMap[currentTheme],
      }}
    >
      <div className={`w-full h-full flex p-20px ${currentTheme}`}>
        <div className="flex-1 flex flex-col">
          <div className="h-160px relative">
            <TextArea
              autoFocus
              value={text}
              maxLength={1000}
              className="!h-full"
              style={{ resize: 'none' }}
              onChange={onTextAreaChange}
              placeholder="二维码内容"
            />
            {setting.isSaveHistory && (
              <Button
                style={{ display: text ? 'block' : 'none' }}
                className="absolute bottom-4px right-0 z-9 opacity-40 hover:opacity-100"
                type="text"
                onClick={() => appendHistory(text)}
              >
                保存到记录
              </Button>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center mt-30px">
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
        {setting.isSaveHistory && <Side />}
      </div>

      <FloatButton.Group
        trigger="click"
        open={isOpenFloatButton}
        onOpenChange={open => setIsOpenFloatButton(open)}
        style={{ right: 30 }}
        icon={<MenuOutlined />}
      >
        <FloatButton icon={<ScanOutlined />} tooltip="扫码" onClick={onScan} />
        <FloatButton icon={<SettingOutlined />} tooltip="设置" onClick={() => setOpen(true)} />
        <FloatButton icon={<WechatOutlined />} tooltip="联系作者/打赏" onClick={onShowContact} />
      </FloatButton.Group>
      <Setting open={open} onClose={() => setOpen(false)} />
    </ConfigProvider>
  )
}

export default HomePage
