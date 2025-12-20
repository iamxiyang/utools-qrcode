import QRCodeStyling from 'qr-code-styling'
import { Setting } from '../types/types'

export interface QRCodeOptions {
  data: string
  size?: number
  margin?: number
  color?: string
  bgColor?: string
  dotStyle?: string
  cornerStyle?: string
  errorLevel?: 'L' | 'M' | 'Q' | 'H'
  logoUrl?: string
  logoSize?: number
}

/**
 * 创建 QRCodeStyling 配置对象
 */
export const createQRCodeOptions = (options: QRCodeOptions) => {
  const {
    data,
    size = 200,
    margin = 10,
    color = '#000000',
    bgColor = '#ffffff',
    dotStyle = 'square',
    cornerStyle = 'square',
    errorLevel = 'M',
    logoUrl,
    logoSize = 0.3,
  } = options

  const logoMargin = Math.max(4, Math.floor(size / 40))

  return {
    width: size,
    height: size,
    margin,
    data,
    dotsOptions: {
      color,
      type: dotStyle as any,
    },
    cornersSquareOptions: {
      color,
      type: cornerStyle as any,
    },
    cornersDotOptions: {
      color,
      type: cornerStyle === 'dot' ? 'dot' : undefined as any,
    },
    backgroundOptions: {
      color: bgColor,
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: logoMargin,
      imageSize: logoSize,
      hideBackgroundDots: true,
    },
    image: logoUrl || undefined,
    qrOptions: {
      errorCorrectionLevel: errorLevel,
    },
  }
}

/**
 * 从设置中创建用于导出的 QR 码生成器
 */
export const createExportQRCode = (
  data: string,
  setting: Setting,
  logoUrl?: string
): QRCodeStyling => {
  return new QRCodeStyling(createQRCodeOptions({
    data,
    size: setting.qrCodeSize,
    margin: setting.qrCodeMargin,
    color: setting.qrCodeColor,
    bgColor: setting.qrCodeBgColor,
    dotStyle: setting.qrCodeDotStyle,
    cornerStyle: setting.qrCodeCornerStyle,
    errorLevel: setting.qrCodeErrorLevel,
    logoUrl,
    logoSize: setting.qrCodeLogoSize,
  }))
}

/**
 * 从设置中创建用于批量生成的 QR 码生成器（无 Logo）
 */
export const createBatchQRCode = (
  data: string,
  setting: Setting
): QRCodeStyling => {
  return new QRCodeStyling(createQRCodeOptions({
    data,
    size: setting.qrCodeSize,
    margin: setting.qrCodeMargin,
    color: setting.qrCodeColor,
    bgColor: setting.qrCodeBgColor,
    dotStyle: setting.qrCodeDotStyle,
    cornerStyle: setting.qrCodeCornerStyle,
    errorLevel: setting.qrCodeErrorLevel,
  }))
}
