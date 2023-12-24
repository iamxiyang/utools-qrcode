export interface Setting {
  // 是否保存解析记录
  isSaveHistory: boolean
  // 是否去重
  isRemoveDuplicates: boolean
  // 保存解析记录的条数
  saveHistoryMaxCount: number
  // 是否自动复制解析结果
  isAutoCopyCode: boolean
  // 是否自动复制生成的二维码
  isAutoCopyQrcode: boolean
  // 二维码相关配置
  qrCodeColor: string
  qrCodeBgColor: string
}
