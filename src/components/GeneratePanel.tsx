import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Form, Switch, Button, App, Slider, Upload, Tooltip, Dropdown, Radio, Tabs, Space } from 'antd'
import type { MenuProps } from 'antd'
import { 
  CopyOutlined, 
  DownloadOutlined, 
  PictureOutlined,
  DownOutlined,
} from '@ant-design/icons'
import QRCodeStyling from 'qr-code-styling'
import { state, addHistory, saveLogo, deleteLogo, getLogoBase64 } from '../store'
import { useProxy } from 'valtio/utils'
import { useDebounce } from '../hooks'
import { QRCodeProtocol, WifiEncryption, DotStyle, CornerStyle } from '../types/types'
import { formatWifi, formatPhone, formatSms, formatEmail, copyImage } from '../utils'
import { SyncedInput, SyncedTextArea } from './SyncedInputs'


const protocolOptions: { key: QRCodeProtocol; icon: string; label: string }[] = [
  { key: 'text', icon: '📝', label: '文本' },
  { key: 'wifi', icon: '📶', label: 'WiFi' },
  { key: 'phone', icon: '📞', label: '电话' },
  { key: 'sms', icon: '💬', label: '短信' },
  { key: 'email', icon: '✉️', label: '邮箱' },
  { key: 'url', icon: '🌐', label: '网址' },
]

const dotStyleOptions: { value: DotStyle; label: string }[] = [
  { value: 'square', label: '方形' },
  { value: 'dots', label: '圆点' },
  { value: 'rounded', label: '圆角' },
  { value: 'extra-rounded', label: '大圆角' },
  { value: 'classy', label: '经典' },
  { value: 'classy-rounded', label: '经典圆角' },
]

const cornerStyleOptions: { value: CornerStyle; label: string }[] = [
  { value: 'square', label: '方形' },
  { value: 'dot', label: '圆点' },
  { value: 'extra-rounded', label: '圆角' },
]

const errorLevelOptions = [
  { value: 'L', label: 'L 低' },
  { value: 'M', label: 'M 中' },
  { value: 'Q', label: 'Q 高' },
  { value: 'H', label: 'H 最高' },
]

export const GeneratePanel: React.FC = () => {
  const { message } = App.useApp()
  const { generateForm: form, setting, savedLogos } = useProxy(state)
  
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const qrCodeInstance = useRef<QRCodeStyling | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  
  const [loadedLogos, setLoadedLogos] = useState<Record<string, string>>({})
  
  useEffect(() => {
    const loaded: Record<string, string> = {}
    savedLogos.forEach(logo => {
      const data = getLogoBase64(logo.id)
      if (data) {
        loaded[logo.id] = data
      }
    })
    setLoadedLogos(loaded)
    
    if (form.logoUrl && form.logoUrl.startsWith('logo-')) {
      const data = getLogoBase64(form.logoUrl)
      if (data) {
        setLogoPreview(data)
      }
    }
  }, [savedLogos])

  const qrCodeContent = useMemo(() => {
    switch (form.protocol) {
      case 'url':
        return form.url || ''
      case 'wifi':
        if (!form.wifiSsid) return ''
        return formatWifi(
          form.wifiSsid,
          form.wifiPassword || '',
          form.wifiEncryption || 'WPA',
          form.wifiHidden
        )
      case 'phone':
        return form.phone ? formatPhone(form.phone) : ''
      case 'sms':
        return form.smsPhone ? formatSms(form.smsPhone, form.smsBody) : ''
      case 'email':
        return form.email ? formatEmail(form.email, form.emailSubject, form.emailBody) : ''
      case 'text':
        return form.text || ''
      default:
        return ''
    }
  }, [form])
  
  const debouncedQrCodeContent = useDebounce(qrCodeContent, 200)
  
  const debouncedColor = useDebounce(setting.qrCodeColor, 200)
  const debouncedBgColor = useDebounce(setting.qrCodeBgColor, 200)
  const debouncedDotStyle = useDebounce(setting.qrCodeDotStyle, 200)
  const debouncedCornerStyle = useDebounce(setting.qrCodeCornerStyle, 200)
  const debouncedMargin = useDebounce(setting.qrCodeMargin, 200)
  const debouncedErrorLevel = useDebounce(setting.qrCodeErrorLevel, 200)
  const debouncedLogoSize = useDebounce(setting.qrCodeLogoSize, 200)
  
  const currentLogoData = useMemo(() => {
    if (logoPreview) return logoPreview
    if (form.logoUrl && form.logoUrl.startsWith('logo-')) {
      return loadedLogos[form.logoUrl] || ''
    }
    return form.logoUrl || ''
  }, [logoPreview, form.logoUrl, loadedLogos])

  useEffect(() => {
    if (!qrCodeRef.current) return

    const previewSize = 560
    const logoMargin = 10
    
    const options = {
      width: previewSize,
      height: previewSize,
      margin: debouncedMargin,
      data: debouncedQrCodeContent || 'https://example.com',
      dotsOptions: {
        color: debouncedColor,
        type: debouncedDotStyle as any,
      },
      cornersSquareOptions: {
        color: debouncedColor,
        type: debouncedCornerStyle as any,
      },
      cornersDotOptions: {
        color: debouncedColor,
        type: debouncedCornerStyle === 'dot' ? 'dot' : undefined as any,
      },
      backgroundOptions: {
        color: debouncedBgColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: logoMargin,
        imageSize: debouncedLogoSize,
        hideBackgroundDots: true,
      },
      image: currentLogoData || undefined,
      qrOptions: {
        errorCorrectionLevel: debouncedErrorLevel,
      },
    }

    if (!qrCodeInstance.current) {
      qrCodeInstance.current = new QRCodeStyling(options)
      qrCodeRef.current.innerHTML = ''
      qrCodeInstance.current.append(qrCodeRef.current)
    } else {
      qrCodeInstance.current.update(options)
    }
  }, [debouncedQrCodeContent, debouncedColor, debouncedBgColor, debouncedDotStyle, debouncedCornerStyle, debouncedMargin, debouncedErrorLevel, debouncedLogoSize, currentLogoData])
  
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (setting.isAutoCopyQRCode && qrCodeContent && isFirstRender.current) {
      const timer = setTimeout(() => {
        handleCopy()
        isFirstRender.current = false
      }, 500)
      return () => clearTimeout(timer)
    }
    isFirstRender.current = false
  }, [qrCodeContent, setting.isAutoCopyQRCode])

  const createExportQRCode = useCallback((data: string) => {
    const logoMargin = Math.max(4, Math.floor(setting.qrCodeSize / 40))
    
    return new QRCodeStyling({
      width: setting.qrCodeSize,
      height: setting.qrCodeSize,
      margin: setting.qrCodeMargin,
      data,
      dotsOptions: {
        color: setting.qrCodeColor,
        type: setting.qrCodeDotStyle as any,
      },
      cornersSquareOptions: {
        color: setting.qrCodeColor,
        type: setting.qrCodeCornerStyle as any,
      },
      cornersDotOptions: {
        color: setting.qrCodeColor,
        type: setting.qrCodeCornerStyle === 'dot' ? 'dot' : undefined as any,
      },
      backgroundOptions: {
        color: setting.qrCodeBgColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: logoMargin,
        imageSize: setting.qrCodeLogoSize,
        hideBackgroundDots: true,
      },
      image: logoPreview || form.logoUrl || undefined,
      qrOptions: {
        errorCorrectionLevel: setting.qrCodeErrorLevel,
      },
    })
  }, [setting, logoPreview, form.logoUrl])

  const handleCopy = useCallback(async () => {
    if (!qrCodeContent) return
    
    try {
      const qrBlob = await createExportQRCode(qrCodeContent).getRawData('png')
      if (qrBlob && qrBlob instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          copyImage(reader.result as string)
          message.success('二维码已复制')
          addHistory(qrCodeContent, 'generate', form.protocol)
        }
        reader.readAsDataURL(qrBlob)
      }
    } catch (e) {
      console.error('Copy error:', e)
      message.error('复制失败')
    }
  }, [message, qrCodeContent, form.protocol, createExportQRCode])


  const handleDownload = useCallback(async (format: 'png' | 'svg') => {
    if (!qrCodeContent) return
    
    try {
      if (format === 'svg') {
        await createExportQRCode(qrCodeContent).download({ 
          name: `qrcode-${Date.now()}`, 
          extension: 'svg' 
        })
        message.success('二维码已下载 (SVG)')
        addHistory(qrCodeContent, 'generate', form.protocol)
        return
      }

      const qrBlob = await createExportQRCode(qrCodeContent).getRawData('png')
      if (qrBlob && qrBlob instanceof Blob) {
        const url = URL.createObjectURL(qrBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qrcode-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        message.success(`二维码已下载 (${format.toUpperCase()})`)
        addHistory(qrCodeContent, 'generate', form.protocol)
      }
    } catch (e) {
      console.error('Download error:', e)
      message.error('下载失败')
    }
  }, [message, qrCodeContent, form.protocol, createExportQRCode])

  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'png',
      label: '下载 PNG',
      onClick: () => handleDownload('png'),
    },
    {
      key: 'svg',
      label: '下载 SVG',
      onClick: () => handleDownload('svg'),
    },
  ]

  const handleLogoUpload = useCallback(async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      try {
        const logoId = await saveLogo(base64, file.name.replace(/\.[^.]+$/, ''))
        if (logoId) {
          setLoadedLogos(prev => ({ ...prev, [logoId]: base64 }))
          setLogoPreview(base64)
          state.generateForm.logoUrl = logoId
          message.success('Logo 已保存')
        } else {
          message.error('Logo 保存失败')
        }
      } catch (err) {
        message.error('Logo 处理失败')
      }
    }
    reader.readAsDataURL(file)
    return false
  }, [message])

  const handleSelectLogo = useCallback((logoId: string) => {
    const logoData = loadedLogos[logoId]
    if (logoData) {
      setLogoPreview(logoData)
      state.generateForm.logoUrl = logoId
    }
  }, [loadedLogos])

  const handleClearLogo = useCallback(() => {
    setLogoPreview('')
    state.generateForm.logoUrl = ''
  }, [])

  const handleDeleteLogo = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    deleteLogo(id)
    setLoadedLogos(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (form.logoUrl === id) {
      setLogoPreview('')
      state.generateForm.logoUrl = ''
    }
    message.success('Logo 已删除')
  }, [message, form.logoUrl])

  const handleProtocolChange = (protocol: QRCodeProtocol) => {
    state.generateForm.protocol = protocol
  }

  const renderForm = () => {
    switch (form.protocol) {
      case 'url':
        return (
          <Form.Item label="网址">
            <SyncedInput
              placeholder="https://example.com"
              value={form.url}
              onChange={(e: any) => (state.generateForm.url = e.target.value)}
              size="large"
            />
          </Form.Item>
        )
      
      case 'wifi':
        return (
          <>
            <Form.Item label="WiFi 名称 (SSID)">
              <SyncedInput
                placeholder="WiFi 名称"
                value={form.wifiSsid}
                onChange={(e: any) => (state.generateForm.wifiSsid = e.target.value)}
                size="large"
              />
            </Form.Item>
            <Form.Item label="密码">
              <SyncedInput
                placeholder="WiFi 密码"
                value={form.wifiPassword}
                onChange={(e: any) => (state.generateForm.wifiPassword = e.target.value)}
                size="large"
              />
            </Form.Item>
            <Form.Item label="加密方式">
              <Radio.Group
                value={form.wifiEncryption}
                onChange={(e) => (state.generateForm.wifiEncryption = e.target.value as WifiEncryption)}
                optionType="button"
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="WPA">WPA/WPA2</Radio.Button>
                <Radio.Button value="WEP">WEP</Radio.Button>
                <Radio.Button value="nopass">无密码</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="隐藏网络">
              <Switch
                checked={form.wifiHidden}
                onChange={(v) => (state.generateForm.wifiHidden = v)}
              />
            </Form.Item>
          </>
        )
      
      case 'phone':
        return (
          <Form.Item label="电话号码">
            <SyncedInput
              placeholder="13800138000"
              value={form.phone}
              onChange={(e: any) => (state.generateForm.phone = e.target.value)}
              size="large"
            />
          </Form.Item>
        )
      
      case 'sms':
        return (
          <>
            <Form.Item label="接收号码">
              <SyncedInput
                placeholder="13800138000"
                value={form.smsPhone}
                onChange={(e: any) => (state.generateForm.smsPhone = e.target.value)}
                size="large"
              />
            </Form.Item>
            <Form.Item label="短信内容（可选）">
              <SyncedTextArea
                placeholder="输入预设的短信内容..."
                value={form.smsBody}
                onChange={(e: any) => (state.generateForm.smsBody = e.target.value)}
                autoSize={{ minRows: 3, maxRows: 5 }}
                maxLength={300}
                showCount
              />
            </Form.Item>
          </>
        )
      
      case 'email':
        return (
          <>
            <Form.Item label="邮箱地址">
              <SyncedInput
                placeholder="example@email.com"
                value={form.email}
                onChange={(e: any) => (state.generateForm.email = e.target.value)}
                size="large"
              />
            </Form.Item>
            <Form.Item label="主题（可选）">
              <SyncedInput
                placeholder="邮件主题"
                value={form.emailSubject}
                onChange={(e: any) => (state.generateForm.emailSubject = e.target.value)}
                size="large"
              />
            </Form.Item>
            <Form.Item label="内容（可选）">
              <SyncedTextArea
                placeholder="邮件内容"
                value={form.emailBody}
                onChange={(e: any) => (state.generateForm.emailBody = e.target.value)}
                autoSize={{ minRows: 3, maxRows: 5 }}
              />
            </Form.Item>
          </>
        )
      
      case 'text':
        return (
          <Form.Item label="文本内容">
            <SyncedTextArea
              placeholder="输入任意文本内容"
              value={form.text}
              onChange={(e: any) => (state.generateForm.text = e.target.value)}
              rows={4}
              maxLength={1000}
              showCount
            />
          </Form.Item>
        )
      
      default:
        return null
    }
  }

  const styleTabItems = [
    {
      key: 'basic',
      label: '基本',
      children: (
        <div>
          <Form.Item label="导出尺寸">
            <Slider
              value={setting.qrCodeSize}
              onChange={(v) => (state.setting.qrCodeSize = v)}
              min={128}
              max={400}
              step={8}
              marks={{ 128: '128', 200: '200', 300: '300', 400: '400' }}
            />
          </Form.Item>
          <div className="flex gap-6 mb-4">
            <Form.Item label="前景色" className="flex-1 mb-0">
              <input
                type="color"
                value={setting.qrCodeColor}
                onChange={(e) => (state.setting.qrCodeColor = e.target.value)}
                className="w-12 h-12 p-1 border-2 border-border rounded-md cursor-pointer bg-transparent transition-colors hover:border-primary"
              />
            </Form.Item>
            <Form.Item label="背景色" className="flex-1 mb-0">
              <input
                type="color"
                value={setting.qrCodeBgColor}
                onChange={(e) => (state.setting.qrCodeBgColor = e.target.value)}
                className="w-12 h-12 p-1 border-2 border-border rounded-md cursor-pointer bg-transparent transition-colors hover:border-primary"
              />
            </Form.Item>
          </div>
          <Form.Item label="容错级别">
            <Radio.Group
              value={setting.qrCodeErrorLevel}
              onChange={(e) => (state.setting.qrCodeErrorLevel = e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              {errorLevelOptions.map(opt => (
                <Radio.Button key={opt.value} value={opt.value}>{opt.label}</Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'advanced',
      label: '高级',
      children: (
        <div>
          <Form.Item label="码点样式">
            <Radio.Group
              value={setting.qrCodeDotStyle}
              onChange={(e) => (state.setting.qrCodeDotStyle = e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              {dotStyleOptions.map(opt => (
                <Radio.Button key={opt.value} value={opt.value}>{opt.label}</Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label="定位点样式">
            <Radio.Group
              value={setting.qrCodeCornerStyle}
              onChange={(e) => (state.setting.qrCodeCornerStyle = e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              {cornerStyleOptions.map(opt => (
                <Radio.Button key={opt.value} value={opt.value}>{opt.label}</Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label="边距">
            <Slider
              value={setting.qrCodeMargin}
              onChange={(v) => (state.setting.qrCodeMargin = v)}
              min={0}
              max={50}
              step={5}
              marks={{ 0: '0', 10: '10', 25: '25', 50: '50' }}
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'logo',
      label: 'Logo',
      children: (
        <div className="flex flex-col gap-4">
          <div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2">
              {/* 不使用 Logo 选项 */}
              <div
                className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-0.5 bg-bg-tertiary hover:border-primary hover:scale-105 ${
                  !form.logoUrl ? 'border-primary shadow-[0_0_0_2px_var(--color-primary-light)]' : 'border-border'
                }`}
                onClick={handleClearLogo}
                title="不使用 Logo"
              >
                <span className={`text-lg ${!form.logoUrl ? 'text-primary' : 'opacity-60'}`}>🚫</span>
                <span className={`text-[10px] font-medium ${!form.logoUrl ? 'text-primary' : 'text-text-tertiary'}`}>无</span>
              </div>
              
              {/* 已保存的 Logo */}
              {savedLogos.map((logo) => {
                const logoData = loadedLogos[logo.id]
                if (!logoData) return null
                return (
                  <div
                    key={logo.id}
                    className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all bg-bg-tertiary hover:border-primary hover:scale-105 ${
                      form.logoUrl === logo.id ? 'border-primary shadow-[0_0_0_2px_var(--color-primary-light)]' : 'border-border'
                    }`}
                    onClick={() => handleSelectLogo(logo.id)}
                  >
                    <img src={logoData} alt={logo.name || 'Logo'} className="w-full h-full object-contain p-1" />
                    <button
                      className="absolute top-0.5 right-0.5 w-[18px] h-[18px] flex items-center justify-center border-none rounded-full bg-black/60 text-white text-xs cursor-pointer opacity-0 transition-opacity hover:bg-error [.aspect-square:hover_&]:opacity-100"
                      onClick={(e) => handleDeleteLogo(logo.id, e)}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {form.logoUrl && (
            <Form.Item label="Logo 大小" className="mb-2">
              <Slider
                value={setting.qrCodeLogoSize}
                onChange={(v) => (state.setting.qrCodeLogoSize = v)}
                min={0.25}
                max={0.45}
                step={0.1}
                marks={{ 0.25: '小', 0.35: '中', 0.45: '大' }}
              />
              <p className="text-[11px] text-text-tertiary mt-1 text-center m-0">容错级别越高，Logo 可显示越大</p>
            </Form.Item>
          )}

          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleLogoUpload}
          >
            <Button icon={<PictureOutlined />} block>
              上传新 Logo
            </Button>
          </Upload>

          <p className="text-xs text-text-tertiary m-0">
            建议使用正方形图片，最多保存 20 个
          </p>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-[900px] mx-auto">
      {/* 协议选择 */}
      <div className="mb-7">
        <div className="flex gap-1.5 flex-wrap">
          {protocolOptions.map((opt) => (
            <div
              key={opt.key}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md cursor-pointer transition-all border ${
                form.protocol === opt.key
                  ? 'bg-primary-light border-primary'
                  : 'bg-bg-secondary border-border-light hover:border-primary/40 hover:bg-primary-light'
              }`}
              onClick={() => handleProtocolChange(opt.key)}
            >
              <span className="text-base">{opt.icon}</span>
              <span className={`text-base font-medium ${form.protocol === opt.key ? 'text-primary font-semibold' : 'text-text'}`}>
                {opt.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6 items-start max-md:flex-col">
        {/* 左侧：二维码预览 */}
        <div className="shrink-0 w-[280px] sticky top-0 max-md:w-full max-md:relative">
          <div className="bg-bg-secondary rounded-lg flex flex-col items-center justify-center shadow-sm relative min-h-[280px] w-full border border-border-light">
            <div className="w-full flex flex-col items-center justify-center p-2.5 rounded-lg" style={{ background: setting.qrCodeBgColor, opacity: qrCodeContent ? 1 : 0 }}>
              <div 
                ref={qrCodeRef} 
                className="w-full aspect-square flex items-center justify-center transition-opacity [&_canvas]:w-full [&_canvas]:h-full [&_svg]:w-full [&_svg]:h-full "
              />
            </div>
            {!qrCodeContent && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center bg-bg-secondary rounded-lg z-10">
                <span className="text-3xl opacity-60">📝</span>
                <span className="text-sm text-text-secondary font-medium">请输入内容</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4 w-full">
            <Tooltip title="复制到剪贴板">
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={!qrCodeContent}
                className="flex-1 rounded-md font-medium"
              >
                复制
              </Button>
            </Tooltip>
            <Space.Compact className="flex-1">
              <Button 
                onClick={() => handleDownload(setting.defaultDownloadFormat)}
                disabled={!qrCodeContent}
                className="flex-1 rounded-l-md font-medium"
              >
                <DownloadOutlined /> 下载
              </Button>
              <Dropdown menu={{ items: downloadMenuItems }} placement="bottomRight" trigger={['click']} disabled={!qrCodeContent}>
                <Button icon={<DownOutlined />} className="rounded-r-md" />
              </Dropdown>
            </Space.Compact>
          </div>
        </div>

        {/* 右侧：配置区 */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* 内容输入 */}
          <div className="config-card bg-bg-secondary rounded-lg p-5 shadow-xs border border-border-light">
            <Form layout="vertical" size="small">
              {renderForm()}
            </Form>
          </div>

          {/* 样式设置 */}
          <div className="config-card bg-bg-secondary rounded-lg p-5 shadow-xs border border-border-light">
            <Tabs
              items={styleTabItems}
              defaultActiveKey="basic"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
