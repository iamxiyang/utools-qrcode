// 应用模式
export type AppMode = 'parse' | 'generate' | 'batch'

// 解析视图状态
export type ParseViewState = 'input' | 'result'

// 二维码协议类型
export type QRCodeProtocol = 'url' | 'wifi' | 'phone' | 'sms' | 'email' | 'text'

// WiFi 加密类型
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'

// 二维码点样式
export type DotStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'

// 二维码角样式
export type CornerStyle = 'square' | 'dot' | 'extra-rounded'

// 设置
export interface Setting {
  // 是否保存历史记录
  isSaveHistory: boolean
  // 是否去重
  isRemoveDuplicates: boolean
  // 历史记录最大保留条数
  maxHistoryCount: number
  // 是否自动复制解析结果
  isAutoCopyParseResult: boolean
  // 是否自动复制生成的二维码
  isAutoCopyQRCode: boolean
  // 二维码相关配置
  qrCodeColor: string
  qrCodeBgColor: string
  qrCodeSize: number
  qrCodeErrorLevel: 'L' | 'M' | 'Q' | 'H'
  qrCodeDotStyle: DotStyle
  qrCodeCornerStyle: CornerStyle
  // 二维码边距
  qrCodeMargin: number
  // Logo 大小比例 (0.1 - 0.5)
  qrCodeLogoSize: number
  // 默认启动模式
  defaultMode: AppMode
  // 默认下载格式
  defaultDownloadFormat: 'png' | 'svg'
}

// 历史记录类型 - 增加 type 区分来源
export type HistoryType = 'parse' | 'generate'

// 历史记录
export interface History {
  id: string
  text: string
  type: HistoryType
  protocol?: QRCodeProtocol
  createTime: number
  // 备注
  remark?: string
}

// 解析后的WiFi信息
export interface ParsedWifi {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}

// 生成表单数据
export interface GenerateFormData {
  protocol: QRCodeProtocol
  // URL
  url?: string
  // WiFi
  wifiSsid?: string
  wifiPassword?: string
  wifiEncryption?: WifiEncryption
  wifiHidden?: boolean
  // 电话
  phone?: string
  // 短信
  smsPhone?: string
  smsBody?: string
  // 邮箱
  email?: string
  emailSubject?: string
  emailBody?: string
  // 文本
  text?: string
  // Logo（临时）
  logoUrl?: string
}

// 批量生成模式
export type BatchInputMode = 'text' | 'file'

// 批量生成配置
export interface BatchConfig {
  prefix: string
  suffix: string
  autoNumber: boolean
  startNumber: number
  // 文件名模板
  fileNameTemplate: string
}

// 批量生成项
export interface BatchItem {
  id: string
  content: string
  generated: boolean
}
