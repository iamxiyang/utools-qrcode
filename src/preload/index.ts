import fs from 'fs'

// 读取图片信息转成base64
export const fileToBase64 = async (filePath: string) => {
  if (!filePath) return ''
  const file = await fs.promises.readFile(filePath)
  const base64 = file.toString('base64')
  return `data:image/png;base64,${base64}`
}
