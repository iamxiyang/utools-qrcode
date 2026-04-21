import React, { useState, useCallback } from 'react'
import { Input, Button, Table, Progress, Form, Switch, InputNumber, App, Space, Radio, Tooltip } from 'antd'
import { DownloadOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { state, generateId } from '../store'
import { useProxy } from 'valtio/utils'
import { BatchItem } from '../types/types'
import JSZip from 'jszip'
import { createBatchQRCode } from '../utils/qrcode'

const { TextArea } = Input

type DownloadMode = 'zip' | 'folder'

export const BatchPanel: React.FC = () => {
  const { message } = App.useApp()
  const { batchConfig, setting } = useProxy(state)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [items, setItems] = useState<BatchItem[]>([])
  const [inputText, setInputText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadMode, setDownloadMode] = useState<DownloadMode>('zip')

  const parseInput = useCallback(() => {
    const lines = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    if (lines.length === 0) {
      message.warning('请输入至少一行内容')
      return
    }

    if (lines.length > 100) {
      message.warning('单次最多支持 100 条')
      return
    }

    const newItems: BatchItem[] = lines.map((line, index) => {
      let finalContent = line
      
      if (batchConfig.prefix) {
        finalContent = batchConfig.prefix + finalContent
      }
      if (batchConfig.suffix) {
        finalContent = finalContent + batchConfig.suffix
      }
      if (batchConfig.autoNumber) {
        finalContent = `${batchConfig.startNumber + index}-${finalContent}`
      }
      
      return {
        id: generateId(),
        content: finalContent,
        generated: false,
      }
    })

    setItems(newItems)
    setCurrentStep(1)
  }, [inputText, batchConfig, message])

  const generateQRCode = useCallback(async (item: BatchItem): Promise<Blob> => {
    const qrCode = createBatchQRCode(item.content, setting)
    
    const qrBlob = await qrCode.getRawData('png')
    if (!qrBlob || !(qrBlob instanceof Blob)) {
      throw new Error('生成失败')
    }

    return qrBlob
  }, [setting])


  const getFileName = useCallback((index: number, content: string) => {
    const template = batchConfig.fileNameTemplate || 'qrcode-{index}'
    return template
      .replace('{index}', String(index + 1).padStart(3, '0'))
      .replace('{content}', content.slice(0, 30).replace(/[\\/:*?"<>|]/g, '_'))
      + '.png'
  }, [batchConfig.fileNameTemplate])

  const handleDownloadZip = useCallback(async () => {
    if (items.length === 0) {
      message.warning('没有可生成的内容')
      return
    }

    setGenerating(true)
    setProgress(0)

    try {
      const zip = new JSZip()
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const blob = await generateQRCode(item)
        zip.file(getFileName(i, item.content), blob)
        setProgress(Math.round(((i + 1) / items.length) * 100))
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcodes-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)

      message.success(`已生成 ${items.length} 个二维码并打包下载`)
    } catch (error) {
      message.error('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }, [items, generateQRCode, message])

  const handleSaveToFolder = useCallback(async () => {
    if (items.length === 0) {
      message.warning('没有可生成的内容')
      return
    }

    const folderPath = await window.utools?.showOpenDialog({
      title: '选择保存目录',
      properties: ['openDirectory', 'createDirectory'],
    })

    if (!folderPath || folderPath.length === 0) {
      return
    }

    const savePath = folderPath[0]
    setGenerating(true)
    setProgress(0)

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const blob = await generateQRCode(item)
        
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        const base64 = await base64Promise
        
        const fileName = getFileName(i, item.content)
        const filePath = `${savePath}/${fileName}`
        
        await window.preload?.saveBase64Image(base64, filePath)
        
        setProgress(Math.round(((i + 1) / items.length) * 100))
      }

      message.success(`已保存 ${items.length} 个二维码到目录`)
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setGenerating(false)
    }
  }, [items, generateQRCode, message])

  const handleDownload = useCallback(() => {
    if (downloadMode === 'zip') {
      handleDownloadZip()
    } else {
      handleSaveToFolder()
    }
  }, [downloadMode, handleDownloadZip, handleSaveToFolder])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setItems([])
    setInputText('')
    setProgress(0)
  }, [])

  const handleDeleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: BatchItem) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(record.id)}
        />
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold m-0 mb-2 text-text">批量生成二维码</h2>
        <p className="text-sm text-text-secondary m-0">输入多行文本，每行生成一个二维码</p>
      </div>

      <div className="bg-bg-secondary rounded-2xl p-7 shadow-sm transition-all hover:shadow-md">
        {/* Step 1: 数据输入 */}
        {currentStep === 0 && (
          <div>
            <div className="mb-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-text">输入内容（每行一个，最多 100 条）</span>
              </div>
              <TextArea
                placeholder="每行一个内容，例如：&#10;https://example.com&#10;https://example.org&#10;..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={10}
                className="font-mono text-sm rounded-lg"
              />
            </div>

            <div className="mb-6 p-5 bg-bg-tertiary rounded-2xl shadow-xs">
              <div className="mb-4 pb-4">
                <div className="flex flex-col gap-1 mb-3">
                  <span className="text-sm font-semibold text-text">📝 内容规则</span>
                  <span className="text-xs text-text-tertiary">自动为每行内容添加前缀、后缀或编号</span>
                </div>
                <Form layout="inline" className="flex flex-wrap gap-4">
                  <Form.Item 
                    label={
                      <Tooltip title="在每条内容前自动添加的文字，如 https://example.com/">
                        <span>前缀</span>
                      </Tooltip>
                    }
                  >
                    <Input
                      placeholder="如: https://"
                      value={batchConfig.prefix}
                      onChange={(e) => (state.batchConfig.prefix = e.target.value)}
                      className="w-[140px]"
                    />
                  </Form.Item>
                  <Form.Item 
                    label={
                      <Tooltip title="在每条内容后自动添加的文字，如 ?source=qr">
                        <span>后缀</span>
                      </Tooltip>
                    }
                  >
                    <Input
                      placeholder="如: ?from=qr"
                      value={batchConfig.suffix}
                      onChange={(e) => (state.batchConfig.suffix = e.target.value)}
                      className="w-[140px]"
                    />
                  </Form.Item>
                  <Form.Item 
                    label={
                      <Tooltip title="开启后会在内容前添加序号，格式如: 1-内容">
                        <span>自动编号</span>
                      </Tooltip>
                    }
                  >
                    <Switch
                      checked={batchConfig.autoNumber}
                      onChange={(v) => (state.batchConfig.autoNumber = v)}
                    />
                  </Form.Item>
                  {batchConfig.autoNumber && (
                    <Form.Item label="起始编号">
                      <InputNumber
                        value={batchConfig.startNumber}
                        onChange={(v) => (state.batchConfig.startNumber = v || 1)}
                        min={1}
                        className="w-20"
                      />
                    </Form.Item>
                  )}
                </Form>
              </div>

              <div>
                <div className="flex flex-col gap-1 mb-3">
                  <span className="text-sm font-semibold text-text">📁 导出设置</span>
                  <span className="text-xs text-text-tertiary">设置导出文件的命名规则</span>
                </div>
                <Form layout="inline" className="flex flex-wrap gap-4">
                  <Form.Item 
                    label={
                      <span>
                        文件名模板
                        <Tooltip title="支持变量: {index} = 序号(如 001), {content} = 内容(自动截取前30字符)">
                          <span className="ml-1 cursor-help opacity-60">ⓘ</span>
                        </Tooltip>
                      </span>
                    }
                  >
                    <Input
                      placeholder="qrcode-{index}"
                      value={batchConfig.fileNameTemplate}
                      onChange={(e) => (state.batchConfig.fileNameTemplate = e.target.value)}
                      className="w-[180px]"
                    />
                  </Form.Item>
                </Form>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <Button type="primary" onClick={parseInput} size="large" className="rounded-full font-semibold">
                下一步：预览
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: 预览确认 */}
        {currentStep === 1 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-text">共 {items.length} 项</span>
              <Button type="link" onClick={handleReset}>
                返回修改
              </Button>
            </div>
            
            <div className="mb-4">
              <Table
                dataSource={items}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ y: 280 }}
                className="rounded-md"
              />
            </div>

            <div className="my-4 p-4 bg-bg-tertiary rounded-md">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">保存方式：</span>
                <Radio.Group 
                  value={downloadMode} 
                  onChange={(e) => setDownloadMode(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="zip">
                    <DownloadOutlined /> 压缩包
                  </Radio.Button>
                  <Radio.Button value="folder">
                    <FolderOpenOutlined /> 选择目录
                  </Radio.Button>
                </Radio.Group>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <Space>
                <Button onClick={handleReset}>返回</Button>
                <Button
                  type="primary"
                  icon={downloadMode === 'zip' ? <DownloadOutlined /> : <FolderOpenOutlined />}
                  onClick={handleDownload}
                  loading={generating}
                  size="large"
                  className="rounded-full font-semibold"
                >
                  {downloadMode === 'zip' ? '生成并下载 ZIP' : '选择目录保存'}
                </Button>
              </Space>
            </div>

            {generating && (
              <div className="mt-4">
                <Progress percent={progress} status="active" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
