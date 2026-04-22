type ScannerModule = typeof import('qr-scanner-wechat')

let scannerModulePromise: Promise<ScannerModule> | null = null
let warmupPromise: Promise<void> | null = null

const getScannerModule = () => {
  if (!scannerModulePromise) {
    scannerModulePromise = import('qr-scanner-wechat')
  }

  return scannerModulePromise
}

export const scan = async (...args: Parameters<ScannerModule['scan']>) => {
  const scanner = await getScannerModule()
  return scanner.scan(...args)
}

export const warmupScanner = () => {
  if (!warmupPromise) {
    warmupPromise = getScannerModule()
      .then(scanner => scanner.ready())
      .catch(() => {})
  }

  return warmupPromise
}
