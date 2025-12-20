import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Button, App, Spin } from 'antd'
import { CameraOutlined, PictureOutlined } from '@ant-design/icons'
import { scan } from 'qr-scanner-wechat'
import { state, addHistory, clearPendingParseImage, clearPendingParseText } from '../store'
import { useProxy } from 'valtio/utils'
import { copyText } from '../utils'
import { ParseResult } from './ParseResult'
import { ParseHistoryList } from './ParseHistoryList'
import { History } from '../types/types'

const imgEl = document.createElement('img')

export const ParsePanel: React.FC = () => {
  const { message } = App.useApp()
  const stateProxy = useProxy(state)
  const { setting, pendingParseImage, pendingParseText } = stateProxy
  
  const [viewState, setViewState] = useState<'input' | 'result'>('input')
  const [parsedText, setParsedText] = useState('')
  const [parsedImage, setParsedImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const parseImg = useCallback(async (base64Str: string) => {
    setIsLoading(true)
    setParsedImage(base64Str)
    
    return new Promise<void>((resolve) => {
      imgEl.onload = async () => {
        try {
          const { text } = await scan(imgEl)
          if (text) {
            setParsedText(text)
            setViewState('result')
            
            if (setting.isAutoCopyParseResult) {
              copyText(text)
              message.success('解析成功，已自动复制')
            } else {
              message.success('解析成功')
            }
            
            addHistory(text, 'parse')
          } else {
            message.error('未识别到二维码')
          }
        } catch (err) {
          message.error('解析失败，请确保图片包含有效的二维码')
        } finally {
          setIsLoading(false)
          resolve()
        }
      }
      imgEl.onerror = () => {
        message.error('图片加载失败')
        setIsLoading(false)
        resolve()
      }
      imgEl.src = base64Str
    })
  }, [message, setting.isAutoCopyParseResult])

  const handleScreenCapture = useCallback(() => {
    window.utools?.screenCapture(parseImg)
  }, [parseImg])

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      parseImg(base64)
    }
    reader.readAsDataURL(file)
    return false
  }, [parseImg])

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => {
              const base64 = ev.target?.result as string
              parseImg(base64)
            }
            reader.readAsDataURL(file)
          }
          return
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [parseImg])

  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.add('drag-over')
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.remove('drag-over')
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.remove('drag-over')

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (ev) => {
            const base64 = ev.target?.result as string
            parseImg(base64)
          }
          reader.readAsDataURL(file)
        }
      }
    }

    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('drop', handleDrop)
    }
  }, [parseImg])

  const handleBack = useCallback(() => {
    setViewState('input')
    setParsedText('')
    setParsedImage('')
  }, [])

  const loadFromHistory = useCallback((text: string) => {
    setParsedText(text)
    setParsedImage('')
    setViewState('result')
  }, [])

  const handleHistorySelect = useCallback((item: History) => {
    loadFromHistory(item.text)
  }, [loadFromHistory])

  useEffect(() => {
    if (pendingParseImage) {
      parseImg(pendingParseImage)
      clearPendingParseImage()
    }
  }, [pendingParseImage, parseImg])

  useEffect(() => {
    if (pendingParseText) {
      loadFromHistory(pendingParseText)
      clearPendingParseText()
    }
  }, [pendingParseText, loadFromHistory])

  if (viewState === 'result') {
    return (
      <ParseResult
        text={parsedText}
        imagePreview={parsedImage}
        onBack={handleBack}
      />
    )
  }

  return (
    <Spin spinning={isLoading} tip="正在解析...">
      <div className="h-full overflow-y-auto" ref={dropZoneRef}>
        <div className=" mx-auto">
          <Upload.Dragger
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload}
            multiple={false}
          >
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 flex items-center justify-center text-2xl text-primary bg-primary-light rounded-lg">
                <PictureOutlined />
              </div>
              <p className="text-base font-semibold text-text m-0">拖拽二维码图片到此</p>
              <p className="text-sm text-text-secondary m-0">
                或 点击上传 · 粘贴截图 (Ctrl+V)
              </p>
            </div>
          </Upload.Dragger>
          
          <div className="flex justify-center mt-6">
            <Button
              type="primary"
              icon={<CameraOutlined />}
              size="large"
              onClick={handleScreenCapture}
              className="h-12 px-8 text-base font-semibold rounded-full shadow-primary"
              style={{ background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' }}
            >
              截图扫码
            </Button>
          </div>
        </div>

        <ParseHistoryList 
          onSelect={handleHistorySelect}
          title="最近解析"
          maxItems={10}
        />
      </div>
    </Spin>
  )
}
