import fs from 'fs'
import path from 'path'

// 读取图片信息转成base64
export const fileToBase64 = async (filePath: string) => {
  if (!filePath) return ''
  const file = await fs.promises.readFile(filePath)
  const base64 = file.toString('base64')
  return `data:image/png;base64,${base64}`
}

// 保存 base64 图片到文件
export const saveBase64Image = async (base64Data: string, filePath: string) => {
  // 移除 data:image/xxx;base64, 前缀
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Content, 'base64')

  // 确保目录存在
  const dir = path.dirname(filePath)
  await fs.promises.mkdir(dir, { recursive: true })

  // 写入文件
  await fs.promises.writeFile(filePath, buffer)
  return true
}
