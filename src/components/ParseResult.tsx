import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Button, Space, Tag, App, Input, Dropdown, Switch } from 'antd'
import type { MenuProps } from 'antd'
import { 
  CopyOutlined, 
  QrcodeOutlined, 
  ArrowLeftOutlined, 
  LinkOutlined,
  ScanOutlined,
  UploadOutlined,
  DownOutlined,
} from '@ant-design/icons'
import QRCodeStyling from 'qr-code-styling'
import { copyText, detectQRCodeType, openUrl, decodeContent, parseContentToFormData } from '../utils'
import { encodeData } from '../utils/qrcode'
import { state, setPendingParseImage } from '../store'
import { useProxy } from 'valtio/utils'
import { ParseHistoryList } from './ParseHistoryList'
import { History } from '../types/types'

const { TextArea } = Input

type ParseMethod = 'screenshot' | 'file'

interface ParseResultProps {
  text: string
  imagePreview?: string
  onBack: () => void
}

export const ParseResult: React.FC<ParseResultProps> = ({ 
  text, 
  imagePreview, 
  onBack
}) => {
  const { message } = App.useApp()
  const { setting } = useProxy(state)
  const [editableText, setEditableText] = useState(text)
  const [showFormatted, setShowFormatted] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastParseMethodRef = useRef<ParseMethod>('screenshot')
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const qrCodeInstance = useRef<QRCodeStyling | null>(null)
  
  // 检测文本是否被修改
  const isTextModified = editableText !== text
  
  const contentType = detectQRCodeType(text)
  const isUrl = /^https?:\/\//i.test(editableText)

  const decodedInfo = useMemo(() => decodeContent(text), [text])
  const canFormat = decodedInfo.formatted !== decodedInfo.decoded && 
                    decodedInfo.type !== 'text'

  // 生成二维码预览（始终生成，用于修改时显示）
  useEffect(() => {
    if (!qrCodeRef.current || !editableText) return

    const options = {
      width: 100,
      height: 100,
      margin: 4,
      data: encodeData(editableText),
      dotsOptions: {
        color: '#000000',
        type: 'square' as const,
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      qrOptions: {
        errorCorrectionLevel: 'M' as const,
      },
    }

    // 使用 setTimeout 确保 DOM 已经渲染
    const timer = setTimeout(() => {
      if (!qrCodeRef.current) return
      
      if (!qrCodeInstance.current) {
        qrCodeInstance.current = new QRCodeStyling(options)
        qrCodeRef.current.innerHTML = ''
        qrCodeInstance.current.append(qrCodeRef.current)
      } else {
        qrCodeInstance.current.update(options)
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [editableText])

  const handleCopy = () => {
    copyText(editableText)
    message.success('已复制到剪贴板')
  }

  const handleCopyFormatted = () => {
    copyText(decodedInfo.formatted)
    message.success('已复制格式化内容')
  }

  const handleRegenerate = () => {
    const formData = parseContentToFormData(editableText)
    state.mode = 'generate'
    Object.assign(state.generateForm, formData)
  }

  const handleOpenUrl = () => {
    if (isUrl) {
      openUrl(editableText)
    }
  }

  const handleScreenshot = useCallback(() => {
    lastParseMethodRef.current = 'screenshot'
    window.utools?.screenCapture((base64: string) => {
      setPendingParseImage(base64)
    })
  }, [])

  const handleSelectFile = useCallback(() => {
    lastParseMethodRef.current = 'file'
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        setPendingParseImage(base64)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }, [])

  const handleContinueParse = useCallback(() => {
    if (lastParseMethodRef.current === 'file') {
      handleSelectFile()
    } else {
      handleScreenshot()
    }
  }, [handleSelectFile, handleScreenshot])

  const parseMenuItems: MenuProps['items'] = [
    {
      key: 'screenshot',
      label: '截图扫码',
      icon: <ScanOutlined />,
      onClick: handleScreenshot,
    },
    {
      key: 'file',
      label: '选择文件',
      icon: <UploadOutlined />,
      onClick: handleSelectFile,
    },
  ]

  const handleHistorySelect = useCallback((item: History) => {
    const formData = parseContentToFormData(item.text)
    state.mode = 'generate'
    Object.assign(state.generateForm, formData)
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      <div className=" mx-auto p-5">
        <div className="flex justify-between items-center mb-5">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="pl-0 font-medium text-text-secondary"
          >
            返回
          </Button>
          
          <Space.Compact block>
            <Button size="small" onClick={handleContinueParse}>
              <ScanOutlined /> 继续解析
            </Button>
            <Dropdown menu={{ items: parseMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button size="small" icon={<DownOutlined />} />
            </Dropdown>
          </Space.Compact>
        </div>

        <div className="bg-bg-secondary rounded-lg p-6 shadow-sm border border-border-light">
          <div className="flex gap-6 items-start">
            {/* 左侧：二维码预览 */}
            <div className="shrink-0 w-[100px] h-[100px] rounded-lg overflow-hidden bg-bg-tertiary flex items-center justify-center border border-border-light relative">
              {/* 始终渲染二维码容器，使用定位覆盖 */}
              <div 
                ref={qrCodeRef} 
                className={`absolute inset-0 flex items-center justify-center [&_canvas]:w-full [&_canvas]:h-full bg-white ${isTextModified ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              />
              {/* 原始图片或占位符 */}
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="二维码" 
                  className={`max-w-full max-h-full object-contain ${isTextModified ? 'opacity-0' : 'opacity-100'}`} 
                />
              ) : !isTextModified && (
                <QrcodeOutlined className="text-3xl text-text-tertiary" />
              )}
            </div>
            
            {/* 右侧：解析结果 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <Tag color="blue" className="rounded-full font-medium px-3 py-1">
                  <span className="mr-1.5">{contentType.icon}</span>
                  <span>{contentType.label}</span>
                </Tag>
                {canFormat && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">格式化</span>
                    <Switch
                      size="small"
                      checked={showFormatted}
                      onChange={setShowFormatted}
                    />
                  </div>
                )}
              </div>
              
              <div className="bg-bg-tertiary rounded-md p-4 max-h-[200px] overflow-y-auto">
                {showFormatted && canFormat ? (
                  <pre className="m-0 text-base leading-relaxed whitespace-pre-wrap break-all font-inherit text-text font-medium">
                    {decodedInfo.formatted}
                  </pre>
                ) : (
                  <TextArea
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    className="!text-base !leading-relaxed !font-medium"
                    placeholder="解析结果"
                    variant="borderless"
                  />
                )}
              </div>
              
              {isTextModified && (
                <p className="text-xs text-text-tertiary mt-2 mb-0">
                  已修改内容，左侧显示修改后的二维码预览
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <Space size="middle" wrap>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={showFormatted && canFormat ? handleCopyFormatted : handleCopy}
              >
                复制
              </Button>
              
              {isUrl && (
                <Button
                  icon={<LinkOutlined />}
                  onClick={handleOpenUrl}
                >
                  打开
                </Button>
              )}
              
              <Button
                icon={<QrcodeOutlined />}
                onClick={handleRegenerate}
              >
                再生成
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <ParseHistoryList 
        onSelect={handleHistorySelect}
        title="最近解析"
        maxItems={10}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
