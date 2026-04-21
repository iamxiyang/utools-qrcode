import { scan, ready } from 'qr-scanner-wechat'

export { scan }

let warmupPromise: Promise<void> | null = null

export const warmupScanner = () => {
  if (!warmupPromise) {
    warmupPromise = ready().catch(() => {})
  }
  return warmupPromise
}
