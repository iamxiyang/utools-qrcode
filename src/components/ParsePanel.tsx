import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Button, App, Spin, Modal, Select } from 'antd'
import { CameraOutlined, PictureOutlined, VideoCameraOutlined, SwapOutlined } from '@ant-design/icons'
import { scan } from 'qr-scanner-wechat'
import {
  state,
  addHistory,
  clearPendingParseImage,
  clearPendingParseText,
  clearPendingParseCamera,
} from '../store'
import { useProxy } from 'valtio/utils'
import { copyText } from '../utils'
import { ParseResult } from './ParseResult'
import { ParseHistoryList } from './ParseHistoryList'
import { History } from '../types/types'

const imgEl = document.createElement('img')
const CAMERA_SCAN_INTERVAL = 240
const isMac = /mac/i.test(navigator.userAgent)

export const ParsePanel: React.FC = () => {
  const { message } = App.useApp()
  const stateProxy = useProxy(state)
  const { setting, pendingParseImage, pendingParseText, pendingParseCamera } = stateProxy
  
  const [viewState, setViewState] = useState<'input' | 'result'>('input')
  const [parsedText, setParsedText] = useState('')
  const [parsedImage, setParsedImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [isCameraScanning, setIsCameraScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string>('')
  
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const cameraTimerRef = useRef<number | null>(null)
  const isCameraScanBusyRef = useRef(false)
  const isCameraOpenRef = useRef(false)

  const applyParseSuccess = useCallback((text: string, imagePreview: string) => {
    setParsedText(text)
    setParsedImage(imagePreview)
    setViewState('result')

    if (setting.isAutoCopyParseResult) {
      copyText(text)
      message.success('解析成功，已自动复制')
    } else {
      message.success('解析成功')
    }

    addHistory(text, 'parse')
  }, [message, setting.isAutoCopyParseResult])

  const parseImg = useCallback(async (base64Str: string) => {
    setIsLoading(true)
    
    return new Promise<void>((resolve) => {
      imgEl.onload = async () => {
        try {
          const { text } = await scan(imgEl)
          if (text) {
            applyParseSuccess(text, base64Str)
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
  }, [applyParseSuccess, message])

  const handleScreenCapture = useCallback(() => {
    window.utools?.screenCapture(parseImg)
  }, [parseImg])

  const waitForVideoElement = useCallback(async (timeoutMs = 2500): Promise<HTMLVideoElement | null> => {
    const startAt = Date.now()
    return new Promise((resolve) => {
      const check = () => {
        if (!isCameraOpenRef.current) {
          resolve(null)
          return
        }
        if (videoRef.current) {
          resolve(videoRef.current)
          return
        }
        if (Date.now() - startAt > timeoutMs) {
          resolve(null)
          return
        }
        window.requestAnimationFrame(check)
      }
      check()
    })
  }, [])

  const waitForVideoReady = useCallback(async (videoEl: HTMLVideoElement, timeoutMs = 1800): Promise<void> => {
    if (videoEl.readyState >= HTMLMediaElement.HAVE_METADATA) return
    await new Promise<void>((resolve) => {
      const done = () => {
        videoEl.removeEventListener('loadedmetadata', done)
        videoEl.removeEventListener('loadeddata', done)
        window.clearTimeout(timer)
        resolve()
      }
      const timer = window.setTimeout(done, timeoutMs)
      videoEl.addEventListener('loadedmetadata', done, { once: true })
      videoEl.addEventListener('loadeddata', done, { once: true })
    })
  }, [])

  const getVideoInputs = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter((item) => item.kind === 'videoinput')
      setVideoDevices(videoInputs)
      return videoInputs
    } catch (err) {
      return []
    }
  }, [])

  const stopCameraLoop = useCallback(() => {
    if (cameraTimerRef.current !== null) {
      window.clearInterval(cameraTimerRef.current)
      cameraTimerRef.current = null
    }
    isCameraScanBusyRef.current = false
    setIsCameraScanning(false)
  }, [])

  const stopCameraStream = useCallback(() => {
    stopCameraLoop()
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
  }, [stopCameraLoop])

  const closeCameraModal = useCallback(() => {
    stopCameraStream()
    setCameraOpen(false)
    setCameraError('')
    setIsCameraLoading(false)
  }, [stopCameraStream])

  const startCameraLoop = useCallback(() => {
    stopCameraLoop()
    setIsCameraScanning(true)

    cameraTimerRef.current = window.setInterval(async () => {
      const video = videoRef.current
      if (!video || isCameraScanBusyRef.current) return
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
      if (!video.videoWidth || !video.videoHeight) return

      const canvas = cameraCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      isCameraScanBusyRef.current = true
      try {
        const { text } = await scan(canvas)
        if (text) {
          const preview = canvas.toDataURL('image/png')
          closeCameraModal()
          applyParseSuccess(text, preview)
        }
      } catch (err) {
        // 逐帧扫描时未识别是正常情况，不提示错误
      } finally {
        isCameraScanBusyRef.current = false
      }
    }, CAMERA_SCAN_INTERVAL)
  }, [applyParseSuccess, closeCameraModal, stopCameraLoop])

  const startCameraStream = useCallback(async (targetDeviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('当前环境不支持摄像头访问')
      return
    }

    setCameraError('')
    setIsCameraLoading(true)

    try {
      const videoInputs = await getVideoInputs()
      if (videoInputs.length === 0) {
        setCameraError('未检测到可用摄像头（请检查系统权限或设备连接）')
        return
      }

      const selectedDeviceId = targetDeviceId || activeDeviceId
      const constraintsList: MediaStreamConstraints[] = []

      if (selectedDeviceId) {
        constraintsList.push({
          audio: false,
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      }

      constraintsList.push(
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        {
          audio: false,
          video: {
            deviceId: { exact: videoInputs[0].deviceId },
          },
        },
        {
          audio: false,
          video: true,
        },
      )

      let stream: MediaStream | null = null
      let lastError: any = null
      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          if (stream) break
        } catch (err) {
          lastError = err
        }
      }

      if (!stream) {
        throw lastError || new Error('getusermedia_failed')
      }

      const track = stream.getVideoTracks()[0]
      if (track) {
        const settings = track.getSettings()
        if (settings.deviceId) {
          setActiveDeviceId(settings.deviceId)
        }
      }

      if (!isCameraOpenRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }

      const videoEl = await waitForVideoElement()
      if (!videoEl) {
        throw new Error('video_not_ready')
      }

      cameraStreamRef.current = stream
      videoEl.srcObject = stream
      videoEl.muted = true
      videoEl.playsInline = true
      try {
        await videoEl.play()
      } catch (playErr) {
        // 某些 WebView 会偶发拦截 play()，保留流并进入扫描循环
        console.warn('camera play failed, continue scanning loop', playErr)
      }
      await waitForVideoReady(videoEl)
      if (!isCameraOpenRef.current) {
        stopCameraStream()
        return
      }
      startCameraLoop()
    } catch (err: any) {
      stopCameraStream()
      const errorName = err?.name
      const errorMessage = err?.message
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setCameraError('未获得摄像头权限，请在系统中允许后重试')
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setCameraError('未检测到可用摄像头')
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setCameraError('摄像头被其他应用占用（如微信/腾讯会议），请关闭后重试')
      } else if (errorName === 'AbortError') {
        setCameraError('摄像头启动被中断，请重试')
      } else if (errorMessage === 'video_not_ready') {
        setCameraError('摄像头组件初始化超时，请重试')
      } else {
        const detail = errorName || errorMessage ? `（${errorName || ''}${errorName && errorMessage ? ': ' : ''}${errorMessage || ''}）` : ''
        setCameraError(`摄像头启动失败，请重试${detail}`)
      }
    } finally {
      setIsCameraLoading(false)
    }
  }, [activeDeviceId, getVideoInputs, startCameraLoop, stopCameraStream, waitForVideoElement, waitForVideoReady])

  const openCameraModal = useCallback(() => {
    setCameraError('')
    setCameraOpen(true)
  }, [])

  const handleRetryCamera = useCallback(() => {
    stopCameraStream()
    startCameraStream()
  }, [startCameraStream, stopCameraStream])

  const handleSwitchCamera = useCallback(async (deviceId: string) => {
    setActiveDeviceId(deviceId)
    stopCameraStream()
    await new Promise<void>((resolve) => setTimeout(resolve, 150))
    startCameraStream(deviceId)
  }, [startCameraStream, stopCameraStream])

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

  useEffect(() => {
    if (pendingParseCamera) {
      openCameraModal()
      clearPendingParseCamera()
    }
  }, [openCameraModal, pendingParseCamera])

  useEffect(() => {
    isCameraOpenRef.current = cameraOpen
  }, [cameraOpen])

  useEffect(() => {
    if (!cameraOpen) return
    startCameraStream()
    return () => {
      stopCameraStream()
    }
  }, [cameraOpen, startCameraStream, stopCameraStream])

  useEffect(() => {
    if (!cameraOpen) return
    const handler = () => { getVideoInputs() }
    navigator.mediaDevices.addEventListener('devicechange', handler)
    return () => { navigator.mediaDevices.removeEventListener('devicechange', handler) }
  }, [cameraOpen, getVideoInputs])

  const cameraModal = (
    <Modal
      title="摄像头扫码"
      open={cameraOpen}
      onCancel={closeCameraModal}
      footer={[
        videoDevices.length > 1 && (
          <Select
            key="device-select"
            value={activeDeviceId || undefined}
            onChange={handleSwitchCamera}
            size="small"
            style={{ width: 160 }}
            placeholder="选择摄像头"
            options={videoDevices.map((d) => ({
              value: d.deviceId,
              label: d.label || `摄像头 ${videoDevices.indexOf(d) + 1}`,
            }))}
          />
        ),
        <Button
          key="retry"
          onClick={handleRetryCamera}
          loading={isCameraLoading}
        >
          重试
        </Button>,
        <Button key="close" type="primary" onClick={closeCameraModal}>
          关闭
        </Button>,
      ].filter(Boolean)}
      centered
      width={520}
    >
      <div className="flex flex-col gap-3">
        <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          {isCameraScanning && !isCameraLoading && !cameraError && (
            <div className="camera-scan-overlay">
              <div className="scan-mask" />
              <div className="scan-frame">
                <div className="scan-line" />
                <div className="scan-corner top-left" />
                <div className="scan-corner top-right" />
                <div className="scan-corner bottom-left" />
                <div className="scan-corner bottom-right" />
              </div>
            </div>
          )}
          {isCameraLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white bg-black/55">
              正在启动摄像头...
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className={`m-0 text-sm flex-1 ${cameraError ? 'text-[#ff4d4f]' : 'text-text-secondary'}`}>
            {cameraError || (isCameraScanning ? '将二维码放入画面中，识别后会自动返回结果' : '摄像头已连接')}
          </p>
        </div>
      </div>
    </Modal>
  )

  if (viewState === 'result') {
    return (
      <>
        <ParseResult
          text={parsedText}
          imagePreview={parsedImage}
          onBack={handleBack}
        />
        {cameraModal}
      </>
    )
  }

  return (
    <>
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

            <div className="flex justify-center mt-6 gap-3">
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
              {!isMac && (
                <Button
                  size="large"
                  icon={<VideoCameraOutlined />}
                  onClick={openCameraModal}
                  className="h-12 px-8 text-base font-semibold rounded-full"
                >
                  摄像头扫码
                </Button>
              )}
            </div>
          </div>
  
          <ParseHistoryList 
            onSelect={handleHistorySelect}
            title="最近解析"
            maxItems={10}
          />
        </div>
      </Spin>

      {cameraModal}
    </>
  )
}
