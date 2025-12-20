import { ParsedWifi, WifiEncryption, QRCodeProtocol, GenerateFormData } from '../types/types'

export const openUrl = (url: string) => {
  window.utools ? utools.shellOpenExternal(url) : window.open(url, '_blank')
}

export const copyText = (text: string) => {
  window.utools ? utools.copyText(text) : navigator.clipboard.writeText(text)
}

export const copyImage = (img: string) => {
  if (window.utools) {
    utools.copyImage(img)
  }
}

// 压缩 Logo 图片（限制尺寸和文件大小）
// uTools 数据库限制单个文档不超过 1MB，Logo 最多 20 个
// 每个 Logo 限制约 30KB，确保总大小安全
export const compressLogo = (base64: string, maxSize = 128, maxBytes = 30 * 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // 计算缩放尺寸（保持正方形）
      const size = Math.min(img.width, img.height, maxSize)

      // 创建 canvas
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!

      // 居中裁剪绘制
      const sourceSize = Math.min(img.width, img.height)
      const sx = (img.width - sourceSize) / 2
      const sy = (img.height - sourceSize) / 2
      ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size)

      // 尝试不同质量压缩
      let quality = 0.9
      let result = canvas.toDataURL('image/jpeg', quality)

      // 如果仍然太大，逐步降低质量
      while (result.length > maxBytes * 1.37 && quality > 0.1) { // base64 约增加 37%
        quality -= 0.1
        result = canvas.toDataURL('image/jpeg', quality)
      }

      resolve(result)
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = base64
  })
}

// 格式化时间显示
export const formatTime = (time: number | string | Date) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  // 24小时内
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  // 7天内
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  }
  // 其他显示完整日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 协议格式化工具
export const formatWifi = (ssid: string, password: string, encryption: string, hidden: boolean = false) => {
  return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`
}

export const formatPhone = (phone: string) => {
  return `tel:${phone}`
}

export const formatSms = (phone: string, body?: string) => {
  let result = `sms:${phone}`
  if (body) {
    result += `?body=${encodeURIComponent(body)}`
  }
  return result
}

export const formatEmail = (email: string, subject?: string, body?: string) => {
  let result = `mailto:${email}`
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  if (params.length > 0) {
    result += `?${params.join('&')}`
  }
  return result
}

// ========================================
// 内容解码工具
// ========================================

// 解码URL（处理中文编码等）
export const decodeUrl = (text: string): string => {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

// 解析WiFi二维码内容
export const parseWifi = (text: string): ParsedWifi | null => {
  if (!/^WIFI:/i.test(text)) return null

  const ssidMatch = text.match(/S:([^;]*);/)
  const passMatch = text.match(/P:([^;]*);/)
  const typeMatch = text.match(/T:([^;]*);/)
  const hiddenMatch = text.match(/H:([^;]*);/)

  return {
    ssid: ssidMatch?.[1] || '',
    password: passMatch?.[1] || '',
    encryption: (typeMatch?.[1] as WifiEncryption) || 'WPA',
    hidden: hiddenMatch?.[1]?.toLowerCase() === 'true',
  }
}

// 格式化WiFi信息为可读文本
export const formatWifiReadable = (wifi: ParsedWifi): string => {
  const lines = [
    `📶 网络名称: ${wifi.ssid}`,
    `🔑 密码: ${wifi.password || '(无密码)'}`,
    `🔒 加密方式: ${wifi.encryption === 'nopass' ? '无' : wifi.encryption}`,
  ]
  if (wifi.hidden) {
    lines.push('👁️ 隐藏网络: 是')
  }
  return lines.join('\n')
}

// 解析并格式化内容（智能解码）
export const decodeContent = (text: string): { decoded: string; formatted: string; type: string } => {
  const typeInfo = detectQRCodeType(text)

  switch (typeInfo.type) {
    case 'url': {
      const decoded = decodeUrl(text)
      return { decoded, formatted: decoded, type: 'url' }
    }
    case 'wifi': {
      const wifi = parseWifi(text)
      if (wifi) {
        return {
          decoded: text,
          formatted: formatWifiReadable(wifi),
          type: 'wifi'
        }
      }
      return { decoded: text, formatted: text, type: 'wifi' }
    }
    case 'phone': {
      const phone = text.replace(/^tel:/i, '')
      return { decoded: phone, formatted: `📞 电话: ${phone}`, type: 'phone' }
    }
    case 'sms': {
      const smsMatch = text.match(/^sms:([^?]+)(?:\?body=(.+))?/i)
      const phone = smsMatch?.[1] || ''
      const body = smsMatch?.[2] ? decodeURIComponent(smsMatch[2]) : ''

      let formatted = `💬 接收号码: ${phone}`
      if (body) formatted += `\n📝 内容: ${body}`

      return { decoded: text, formatted, type: 'sms' }
    }
    case 'email': {
      const emailMatch = text.match(/^mailto:([^?]+)/)
      const subjectMatch = text.match(/subject=([^&]+)/)
      const bodyMatch = text.match(/body=([^&]+)/)

      const email = emailMatch?.[1] || ''
      const subject = subjectMatch ? decodeURIComponent(subjectMatch[1]) : ''
      const body = bodyMatch ? decodeURIComponent(bodyMatch[1]) : ''

      let formatted = `✉️ 邮箱: ${email}`
      if (subject) formatted += `\n📋 主题: ${subject}`
      if (body) formatted += `\n📝 内容: ${body}`

      return { decoded: text, formatted, type: 'email' }
    }
    default:
      return { decoded: text, formatted: text, type: 'text' }
  }
}

// 解析二维码内容类型
export const detectQRCodeType = (text: string): { type: string; label: string; icon: string } => {
  if (/^https?:\/\//i.test(text)) {
    return { type: 'url', label: '网址', icon: '🌐' }
  }
  if (/^WIFI:/i.test(text)) {
    return { type: 'wifi', label: 'WiFi', icon: '📶' }
  }
  if (/^tel:/i.test(text)) {
    return { type: 'phone', label: '电话', icon: '📞' }
  }
  if (/^sms:/i.test(text)) {
    return { type: 'sms', label: '短信', icon: '💬' }
  }
  if (/^mailto:/i.test(text)) {
    return { type: 'email', label: '邮箱', icon: '✉️' }
  }
  if (/^BEGIN:VCARD/i.test(text)) {
    return { type: 'vcard', label: '名片', icon: '👤' }
  }
  return { type: 'text', label: '文本', icon: '📝' }
}

// 根据解析的二维码内容，填充生成表单数据
export const parseContentToFormData = (text: string): Partial<GenerateFormData> => {
  const typeInfo = detectQRCodeType(text)

  switch (typeInfo.type) {
    case 'url':
      return {
        protocol: 'url' as QRCodeProtocol,
        url: text,
      }

    case 'wifi': {
      const wifi = parseWifi(text)
      if (wifi) {
        return {
          protocol: 'wifi' as QRCodeProtocol,
          wifiSsid: wifi.ssid,
          wifiPassword: wifi.password,
          wifiEncryption: wifi.encryption,
          wifiHidden: wifi.hidden,
        }
      }
      return {
        protocol: 'text' as QRCodeProtocol,
        text: text,
      }
    }

    case 'phone': {
      const phone = text.replace(/^tel:/i, '')
      return {
        protocol: 'phone' as QRCodeProtocol,
        phone: phone,
      }
    }

    case 'sms': {
      const smsMatch = text.match(/^sms:([^?]+)(?:\?body=(.+))?/i)
      return {
        protocol: 'sms' as QRCodeProtocol,
        smsPhone: smsMatch?.[1] || '',
        smsBody: smsMatch?.[2] ? decodeURIComponent(smsMatch[2]) : '',
      }
    }

    case 'email': {
      const emailMatch = text.match(/^mailto:([^?]+)/)
      const subjectMatch = text.match(/subject=([^&]+)/)
      const bodyMatch = text.match(/body=([^&]+)/)

      return {
        protocol: 'email' as QRCodeProtocol,
        email: emailMatch?.[1] || '',
        emailSubject: subjectMatch ? decodeURIComponent(subjectMatch[1]) : '',
        emailBody: bodyMatch ? decodeURIComponent(bodyMatch[1]) : '',
      }
    }

    default:
      return {
        protocol: 'text' as QRCodeProtocol,
        text: text,
      }
  }
}

// 截断文本
export const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 下载文件
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 下载图片
export const downloadImage = (dataUrl: string, filename: string = 'qrcode.png') => {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

// Canvas 转 DataURL
export const canvasToDataURL = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png')
}
