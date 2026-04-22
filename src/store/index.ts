import { proxy, snapshot, subscribe, ref } from 'valtio'
import { History, Setting, AppMode, GenerateFormData, BatchConfig, BatchItem } from '../types/types'
import { subscribeKey } from 'valtio/utils'

const initialSetting: Setting = {
  isSaveHistory: true,
  isRemoveDuplicates: true,
  maxHistoryCount: 50,
  isAutoCopyParseResult: false,
  isAutoCopyQRCode: false,
  qrCodeColor: '#000000',
  qrCodeBgColor: '#ffffff',
  qrCodeSize: 200,
  qrCodeErrorLevel: 'M',
  qrCodeDotStyle: 'square',
  qrCodeCornerStyle: 'square',
  qrCodeMargin: 10,
  qrCodeLogoSize: 0.3,

  defaultDownloadFormat: 'png',
}

const initialGenerateForm: GenerateFormData = {
  protocol: 'text',
  url: '',
  wifiSsid: '',
  wifiPassword: '',
  wifiEncryption: 'WPA',
  wifiHidden: false,
  phone: '',
  email: '',
  emailSubject: '',
  emailBody: '',
  text: '',
  logoUrl: '',
}

const initialBatchConfig: BatchConfig = {
  prefix: '',
  suffix: '',
  autoNumber: false,
  startNumber: 1,
  fileNameTemplate: 'qrcode-{index}',
}

type SavedLogoMeta = {
  id: string
  name?: string
}

type UsageStats = {
  totalUseCount: number
  appreciateShown: boolean
}

const initialUsageStats: UsageStats = {
  totalUseCount: 0,
  appreciateShown: false,
}

type State = {
  // 当前模式
  mode: AppMode
  // 设置
  setting: Setting
  // 历史记录（统一存储解析和生成的历史）
  history: History[]
  // 生成表单数据
  generateForm: GenerateFormData
  // 批量生成配置
  batchConfig: BatchConfig
  // 批量生成项目列表
  batchItems: BatchItem[]
  // 历史记录展开状态
  historyExpanded: boolean
  // 已保存的 Logo 元数据列表（实际数据存在 attachment）
  savedLogos: SavedLogoMeta[]
  // 使用统计
  usageStats: UsageStats
  // 本地持久化数据是否已完成加载
  storageHydrated: boolean
  // 待解析图片（Base64）- 用于跨组件传递解析指令
  pendingParseImage: string | null
  // 待加载的历史文本 - 用于从历史记录加载到解析结果
  pendingParseText: string | null
  // 待启动摄像头扫码 - 用于跨组件触发摄像头扫描
  pendingParseCamera: boolean
}

// 迁移旧数据逻辑
const migrateOldHistory = (oldHistory: unknown): History[] => {
  if (!Array.isArray(oldHistory) || oldHistory.length === 0) return []

  // 迁移旧格式（仅在没有新历史且有旧历史时执行一次）
  return oldHistory.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return {
        id: `migrate-${Date.now()}-${index}`,
        text: item,
        type: 'parse' as const,
        createTime: Date.now(),
      }
    }
    return {
      id: item.id || `migrate-${Date.now()}-${index}`,
      text: item.text,
      type: 'parse' as const,
      createTime: item.createTime || Date.now(),
    }
  })
}

const readStoredHistory = (): History[] => {
  const storedHistory = utools.dbStorage.getItem('history')
  if (Array.isArray(storedHistory)) {
    return storedHistory
  }

  return migrateOldHistory(utools.dbStorage.getItem('DecodeHistory'))
}

const mergeChangedFields = <T extends Record<string, any>>(initial: T, current: T, hydrated: Partial<T>) => {
  const merged = {
    ...initial,
    ...hydrated,
  } as T

  for (const key of Object.keys(current) as Array<keyof T>) {
    if (!Object.is(current[key], initial[key])) {
      merged[key] = current[key]
    }
  }

  return merged
}

const mergeUniqueById = <T extends { id: string }>(current: T[], hydrated: T[]) => {
  const merged = [...current]
  const seen = new Set(current.map(item => item.id))

  for (const item of hydrated) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    merged.push(item)
  }

  return merged
}

const state = proxy<State>({
  mode: 'parse',
  setting: { ...initialSetting },
  history: [],
  generateForm: { ...initialGenerateForm },
  batchConfig: { ...initialBatchConfig },
  batchItems: [],
  historyExpanded: false,
  savedLogos: [],
  usageStats: { ...initialUsageStats },
  storageHydrated: false,
  pendingParseImage: null,
  pendingParseText: null,
  pendingParseCamera: false,
})

let hydratePromise: Promise<void> | null = null

export const hydratePersistedState = () => {
  if (hydratePromise) return hydratePromise

  hydratePromise = Promise.resolve().then(() => {
    try {
      const storedSetting = utools.dbStorage.getItem('setting') || {}
      const storedLogos = utools.dbStorage.getItem('savedLogos')
      const storedUsageStats = utools.dbStorage.getItem('usageStats') || initialUsageStats

      Object.assign(
        state.setting,
        mergeChangedFields(initialSetting, snapshot(state.setting), storedSetting),
      )

      state.history = mergeUniqueById(state.history, readStoredHistory())
      state.savedLogos = mergeUniqueById(
        state.savedLogos,
        Array.isArray(storedLogos) ? storedLogos : [],
      )

      Object.assign(state.usageStats, {
        totalUseCount: Math.max(
          storedUsageStats.totalUseCount || 0,
          state.usageStats.totalUseCount,
        ),
        appreciateShown: Boolean(
          storedUsageStats.appreciateShown || state.usageStats.appreciateShown,
        ),
      })
    } catch (err) {
      console.error('持久化数据加载失败:', err)
    } finally {
      state.storageHydrated = true
    }
  })

  return hydratePromise
}

// --- 性能优化：防抖持久化 ---
// 只对必须跨会话保存的 key 进行订阅
const createPersist = (key: string, delay = 1000) => {
  let timer: any
  return (value: any) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      utools.dbStorage.setItem(key, value)
    }, delay)
  }
}

const saveSetting = createPersist('setting', 1000)
const saveHistory = createPersist('history', 2000)
const saveLogos = createPersist('savedLogos', 1500)
const saveStats = createPersist('usageStats', 3000)

// 监听必须持久化的数据变化
subscribe(state.setting, () => saveSetting(snapshot(state.setting)))
subscribeKey(state, 'history', () => saveHistory(snapshot(state.history)))
subscribeKey(state, 'savedLogos', () => saveLogos(snapshot(state.savedLogos)))
subscribeKey(state, 'usageStats', () => saveStats(snapshot(state.usageStats)))

// 辅助函数：生成唯一ID
export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// 辅助函数：增加使用次数
export const incrementUsageCount = () => {
  state.usageStats.totalUseCount += 1
}

// 辅助函数：标记已显示赞赏引导
export const markAppreciateShown = () => {
  state.usageStats.appreciateShown = true
}

// 辅助函数：检查是否应该显示赞赏引导
export const shouldShowAppreciate = () => {
  return state.usageStats.totalUseCount >= 10 && !state.usageStats.appreciateShown
}

// 辅助函数：设置待解析图片
// 使用 ref 包装大字符串，避免 Valtio 对 base64 数据进行深度代理追踪
export const setPendingParseImage = (base64: string | null) => {
  state.pendingParseImage = base64 ? (ref({ data: base64 }) as any).data : null
}

// 辅助函数：清除待解析图片
export const clearPendingParseImage = () => {
  state.pendingParseImage = null
}

// 辅助函数：设置待加载的历史文本
export const setPendingParseText = (text: string | null) => {
  state.pendingParseText = text
}

// 辅助函数：清除待加载文本
export const clearPendingParseText = () => {
  state.pendingParseText = null
}

// 辅助函数：设置待启动摄像头扫码
export const setPendingParseCamera = (pending: boolean) => {
  state.pendingParseCamera = pending
}

// 辅助函数：清除待启动摄像头扫码
export const clearPendingParseCamera = () => {
  state.pendingParseCamera = false
}

// 辅助函数：添加历史记录
export const addHistory = (text: string, type: 'parse' | 'generate', protocol?: any) => {
  if (!text || !state.setting.isSaveHistory) return

  // 增加使用次数统计
  incrementUsageCount()

  const newItem: History = {
    id: generateId(),
    text,
    type,
    protocol,
    createTime: Date.now(),
  }

  let newHistory = [newItem, ...state.history]

  // 去重
  if (state.setting.isRemoveDuplicates) {
    const seen = new Set<string>()
    newHistory = newHistory.filter(item => {
      if (seen.has(item.text)) return false
      seen.add(item.text)
      return true
    })
  }

  // 限制条数
  if (newHistory.length > state.setting.maxHistoryCount) {
    newHistory = newHistory.slice(0, state.setting.maxHistoryCount)
  }

  state.history = newHistory
}

// 辅助函数：删除历史记录
export const deleteHistory = (id: string) => {
  state.history = state.history.filter(item => item.id !== id)
}

// 辅助函数：清空历史记录
export const clearHistory = () => {
  state.history = []
}

// 辅助函数：更新历史记录备注
export const updateHistoryRemark = (id: string, remark: string) => {
  const item = state.history.find(item => item.id === id)
  if (item) {
    item.remark = remark
  }
}

// 辅助函数：重置生成表单
export const resetGenerateForm = () => {
  Object.assign(state.generateForm, initialGenerateForm)
}

// 辅助函数：保存 Logo（使用 postAttachment 存储文件）
export const saveLogo = async (base64Data: string, name?: string): Promise<string | null> => {
  const id = `logo-${generateId()}`

  try {
    // 将 base64 转换为 Uint8Array
    const base64Content = base64Data.split(',')[1] || base64Data
    const binaryString = atob(base64Content)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 获取 MIME 类型
    const mimeMatch = base64Data.match(/^data:([^;]+);/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'

    // 存储附件
    const result = utools.db.postAttachment(id, bytes, mimeType)
    if (!result.ok) {
      console.error('Logo 存储失败:', result.message)
      return null
    }

    // 保存元数据
    const newLogo = { id, name: name || `Logo ${state.savedLogos.length + 1}` }
    // 限制最多保存 20 个 Logo
    if (state.savedLogos.length >= 20) {
      state.savedLogos = [newLogo, ...state.savedLogos.slice(0, 19)]
    } else {
      state.savedLogos = [newLogo, ...state.savedLogos]
    }

    return id
  } catch (err) {
    console.error('Logo 添加失败:', err)
    return null
  }
}

// 辅助函数：获取 Logo Base64 数据（从 attachment 读取）
export const getLogoBase64 = (id: string): string | null => {
  try {
    const buffer = utools.db.getAttachment(id)
    if (!buffer) return null

    // 获取 MIME 类型
    const mimeType = utools.db.getAttachmentType(id) || 'image/png'

    // 转换为 base64
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return `data:${mimeType};base64,${btoa(binary)}`
  } catch (err) {
    console.error('Logo 读取失败:', err)
    return null
  }
}

// 辅助函数：删除 Logo（同时删除元数据和附件）
export const deleteLogo = (id: string) => {
  // 从元数据列表中移除
  state.savedLogos = state.savedLogos.filter(logo => logo.id !== id)

  // 删除文档及其附件，释放存储空间
  // uTools 的附件通过 postAttachment(docId, ...) 添加，删除该 id 的文档即可
  try {
    utools.db.remove(id)
  } catch (err) {
    console.error('删除 Logo 失败:', err)
  }

  // 如果当前使用的 Logo 被删除，清除选择
  if (state.generateForm.logoUrl?.startsWith('logo-')) {
    const deleted = !state.savedLogos.find(logo => logo.id === state.generateForm.logoUrl)
    if (deleted) {
      state.generateForm.logoUrl = ''
    }
  }
}

export { state }
