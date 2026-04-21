import React, { lazy, Suspense, useCallback, useEffect, useState, useRef } from 'react'
import { ConfigProvider, theme, App, Tooltip, Modal, Button, Spin } from 'antd'
import {
  SettingOutlined,
  ScanOutlined,
  HistoryOutlined,
  WechatOutlined,
  QrcodeOutlined,
  AppstoreOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { useTheme, useSyncThemeClass } from './hooks'
import {
  state,
  shouldShowAppreciate,
  markAppreciateShown,
  setPendingParseImage,
  setPendingParseText,
  setPendingParseCamera,
} from './store'
import { useProxy } from 'valtio/utils'
import { AppMode, History } from './types/types'
import { GeneratePanel } from './components/GeneratePanel'
import { BatchPanel } from './components/BatchPanel'
import { HistoryDrawer } from './components/HistoryDrawer'
import { Setting } from './components/Setting'
import { Contact } from './components/Contact'

const LazyParsePanel = lazy(() =>
  import('./components/ParsePanel').then(m => ({ default: m.ParsePanel }))
)

const ThemeMap = {
  dark: theme.darkAlgorithm,
  light: theme.defaultAlgorithm,
}

const ThemeTokens = {
  dark: {
    colorPrimary: '#3b82f6',
    colorLink: '#3b82f6',
    borderRadius: 8,
  },
  light: {
    colorPrimary: '#2563eb',
    colorLink: '#2563eb',
    borderRadius: 8,
  },
}

const modeOptions = [
  { key: 'parse' as const, label: '解析', icon: <ScanOutlined /> },
  { key: 'generate' as const, label: '生成', icon: <QrcodeOutlined /> },
  { key: 'batch' as const, label: '批量', icon: <AppstoreOutlined /> },
]

function HomePage() {
  const currentTheme = useTheme()
  const { modal } = App.useApp()

  const { mode: currentMode, usageStats } = useProxy(state)
  const { history } = useProxy(state)
  const historyCount = history.length

  const initialHistoryCount = useRef(historyCount)

  const [settingOpen, setSettingOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [appreciateOpen, setAppreciateOpen] = useState(false)

  // 检测是否需要显示赞赏引导
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowAppreciate()) {
        setAppreciateOpen(true)
        markAppreciateShown()
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // 处理 uTools 入口
  useEffect(() => {
    utools.onPluginEnter(({ code, type, payload }) => {
      // 根据 feature code 决定模式
      switch (code) {
        case 'generate':
          state.mode = 'generate'
          // URL 正则匹配或选中文本
          if (type === 'regex' || type === 'over') {
            if (/^https?:\/\//i.test(payload)) {
              state.generateForm.protocol = 'url'
              state.generateForm.url = payload
            } else {
              state.generateForm.protocol = 'text'
              state.generateForm.text = payload
            }
          }
          // 浏览器窗口
          else if (type === 'window') {
            window.utools.readCurrentBrowserUrl().then(url => {
              if (url) {
                state.generateForm.protocol = 'url'
                state.generateForm.url = url
              }
            })
          }
          break

        case 'parse':
          state.mode = 'parse'
          // 图片文件
          if (type === 'files') {
            window.preload?.fileToBase64(payload[0].path).then((base64: string) => {
              setPendingParseImage(base64)
            })
          }
          // 剪贴板图片
          else if (type === 'img') {
            setPendingParseImage(payload)
          }
          // 关键词
          else {
            const keyword = typeof payload === 'string' ? payload.toLowerCase() : ''
            // 明确提到摄像头/相机时，优先触发摄像头扫码
            if (keyword.includes('摄像头') || keyword.includes('相机') || keyword.includes('camera')) {
              setTimeout(() => {
                setPendingParseCamera(true)
              }, 100)
            }
            // 只有明确的扫码/截图指令才触发截图
            else if (keyword.includes('扫') || keyword.includes('截图')) {
              setTimeout(() => {
                window.utools?.screenCapture((base64: string) => {
                  setPendingParseImage(base64)
                })
              }, 100)
            }
          }
          break

        case 'batch':
          state.mode = 'batch'
          break

        case 'default':
        default:
          state.mode = 'parse'
          break
      }
    })
  }, [])

  const handleModeChange = useCallback((value: AppMode) => {
    state.mode = value
  }, [])

  const handleHistorySelect = useCallback(
    (item: History) => {
      setHistoryOpen(false)
      if (currentMode === 'parse') {
        setPendingParseText(item.text)
      } else {
        state.generateForm.protocol = 'text'
        state.generateForm.text = item.text
      }
    },
    [currentMode],
  )

  const handleShowContact = useCallback(() => {
    modal.info({
      title: '联系/打赏作者',
      width: 480,
      centered: true,
      icon: null,
      okText: '关闭',
      content: Contact,
      className: 'contact-modal',
    })
  }, [modal])

  return (
    <>
      <div className={`w-full h-full flex flex-col bg-bg overflow-hidden ${currentTheme}`}>
        {/* 顶部导航 */}
        <header className="shrink-0 flex justify-between items-center px-6 py-3 bg-bg-blur backdrop-blur-xl sticky top-0 z-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex bg-bg-tertiary rounded-full p-1 gap-1">
            {modeOptions.map(opt => (
              <button
                key={opt.key}
                className={`mode-switch-btn flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 bg-transparent border-none outline-none ${
                  currentMode === opt.key
                    ? 'bg-bg-secondary text-primary shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text hover:bg-bg-secondary font-medium'
                }`}
                onClick={() => handleModeChange(opt.key)}
              >
                <span className="text-base">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-1">
            <Tooltip title="历史记录" placement="bottom">
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-md cursor-pointer transition-all duration-150 bg-transparent text-text-secondary border-none outline-none text-lg hover:bg-primary-light hover:text-primary"
                onClick={() => setHistoryOpen(true)}
              >
                <HistoryOutlined />
                {historyCount > 0 && (
                  <span
                    className={`absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] font-semibold leading-4 text-center text-white rounded-full transition-colors ${
                      historyCount > initialHistoryCount.current ? 'bg-primary' : 'bg-text-tertiary'
                    }`}
                  >
                    {historyCount > 99 ? '99+' : historyCount}
                  </span>
                )}
              </button>
            </Tooltip>
            <Tooltip title="联系作者" placement="bottom">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-md cursor-pointer transition-all duration-150 bg-transparent text-text-secondary border-none outline-none text-lg hover:bg-primary-light hover:text-primary"
                onClick={handleShowContact}
              >
                <WechatOutlined />
              </button>
            </Tooltip>
            <Tooltip title="设置" placement="bottom">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-md cursor-pointer transition-all duration-150 bg-transparent text-text-secondary border-none outline-none text-lg hover:bg-primary-light hover:text-primary"
                onClick={() => setSettingOpen(true)}
              >
                <SettingOutlined />
              </button>
            </Tooltip>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div style={{ display: currentMode === 'parse' ? 'block' : 'none' }}>
            <Suspense fallback={<div className="flex items-center justify-center h-40"><Spin /></div>}>
              <LazyParsePanel />
            </Suspense>
          </div>
          <div style={{ display: currentMode === 'generate' ? 'block' : 'none' }}>
            <GeneratePanel />
          </div>
          <div style={{ display: currentMode === 'batch' ? 'block' : 'none' }}>
            <BatchPanel />
          </div>
        </main>

        <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onSelect={handleHistorySelect} />

        <Setting open={settingOpen} onClose={() => setSettingOpen(false)} />

        {/* 赞赏引导弹窗 */}
        <Modal open={appreciateOpen} onCancel={() => setAppreciateOpen(false)} footer={null} centered width={340}>
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <HeartOutlined className="text-3xl text-[#ff4d4f] animate-heartbeat" />
              <h3 className="m-0 text-xl font-semibold text-text">感谢您的使用！</h3>
            </div>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              您已使用本插件 <strong className="text-primary font-semibold">{usageStats.totalUseCount}</strong> 次，
              如果觉得好用，可以请作者喝杯咖啡 ☕
            </p>
            <img
              src="./appreciate.jpg"
              alt="赞赏作者"
              className="w-[180px] h-[180px] rounded-lg shadow-lg border border-border bg-white p-2"
            />
            <p className="text-xs text-text-tertiary mt-3 mb-0">微信扫码支持开发</p>
            <Button type="primary" block onClick={() => setAppreciateOpen(false)} className="mt-4">
              继续使用
            </Button>
          </div>
        </Modal>
      </div>
    </>
  )
}

// 根组件
function RootApp() {
  const currentTheme = useTheme()

  useSyncThemeClass()

  return (
    <ConfigProvider
      theme={{
        cssVar: { key: 'qrcode' },
        hashed: false,
        algorithm: ThemeMap[currentTheme],
        token: ThemeTokens[currentTheme],
      }}
    >
      <App>
        <HomePage />
      </App>
    </ConfigProvider>
  )
}

export { RootApp, HomePage }
