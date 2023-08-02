import React, { useState } from 'react'
import { scan } from 'qr-scanner-wechat'
import './index.scss'

function App() {

  const [showTab, setShowTab] = useState<string>('scanCode')

  const changeTab = (value: string) => {
    setShowTab(value);
  }

  return <div className="position-fixed top-0 right-0 bottom-0 left-0">
    <div className=' w-85% h-100%'>
      {
        {
          'scanCode': <ScanCode></ScanCode>,
          'history': <History></History>,
          'settings': <Settings></Settings>
        }[showTab]
      }
    </div>
    <div className='w-15% h-100% bg-#F7F7F7 position-absolute right-0 top-0 flex flex-col'>
      <button
        className={`w-100% h-40px m-t-15px ${showTab == 'scanCode' ? 'active' : ''}`}
        onClick={() => changeTab('scanCode')}>扫码</button>
      <button
        className={`w-100% h-40px m-t-15px ${showTab == 'history' ? 'active' : ''}`}
        onClick={() => changeTab('history')}>历史记录</button>
      <button
        className={`w-100% h-40px m-t-15px ${showTab == 'settings' ? 'active' : ''}`}
        onClick={() => changeTab('settings')}>设置</button>
    </div>
  </div>
}

const ScanCode = () => {
  return (
    <div className='w-100% h-100% flex flex-col'>
      <div className='h-50% w-100% bg-red'>
        <textarea placeholder='请输入内容或粘贴二维码' className='w-100% h-100%'></textarea>
      </div>
      <div className='w-100% h-1px bg-#000'></div>
      <div className='h-50% w-100% flex flex-items-center flex-justify-center bg-#fff'>
        <img className='w-400px h-400px' src="https://img1.imgtp.com/2023/08/02/XwKLFru1.png" />
      </div>
    </div>
  )
}

const History = () => {
  return (
    <div className='w-100% h-100% flex flex-col'>
      历史记录
    </div>
  )
}

const Settings = () => {
  return (
    <div className='w-100% h-100% flex flex-col'>
      设置
    </div>
  )
}

export default App
