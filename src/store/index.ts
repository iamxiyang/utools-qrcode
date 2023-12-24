import { proxy, snapshot, subscribe } from 'valtio'
import { Setting } from '../types/types'
import { subscribeKey } from 'valtio/utils'

const initialSetting = {
  isSaveHistory: true,
  isRemoveDuplicates: false,
  saveHistoryMaxCount: 20,
  isAutoCopyCode: false,
  isAutoCopyQrcode: false,
  isShowFloatButton: true,
  // 二维码相关配置
  qrCodeColor: '#000000',
  qrCodeBgColor: '#ffffff',
}

type State = {
  setting: Setting
  decodeHistory: string[]
}

const state = proxy<State>({
  setting: {
    ...initialSetting,
    ...(utools.dbStorage.getItem('setting') || {}),
  },
  decodeHistory: utools.dbStorage.getItem('DecodeHistory') || [],
})

// 监听数据变化，保存到数据库
subscribe(state.setting, () => {
  console.log('setting change')
  utools.dbStorage.setItem('setting', snapshot(state.setting))
})
// decodeHistory会被直接重新赋值，所以需要使用subscribeKey监听
subscribeKey(state, 'decodeHistory', () => {
  console.log('decodeHistory change')
  utools.dbStorage.setItem('DecodeHistory', snapshot(state.decodeHistory))
})

export { state }
