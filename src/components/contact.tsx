import { Button } from 'antd'
import { openUrl } from '../utils'
import { ReactNode } from 'react'

const GIT_URL = 'https://github.com/iamxiyang/utools-qrcode'

export const Contact: ReactNode = (
  <div className="py-4">
    <div className="flex gap-6 justify-around mb-5">
      <div className="flex flex-col items-center gap-2">
        <img 
          src="./wechat.jpg" 
          alt="联系作者" 
          className="w-40 h-40 rounded-lg shadow-sm border border-border bg-white p-2"
        />
        <p className="m-0 text-sm text-text-secondary font-medium">微信扫码联系作者</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <img 
          src="./appreciate.jpg" 
          alt="赞赏作者" 
          className="w-40 h-40 rounded-lg shadow-sm border border-border bg-white p-2"
        />
        <p className="m-0 text-sm text-text-secondary font-medium">微信扫码支持开发</p>
      </div>
    </div>
    <div className="text-center mb-3 p-3 bg-bg-tertiary rounded-md">
      <span className="text-sm text-text-secondary mr-1">开源地址：</span>
      <Button type="link" size="small" onClick={() => openUrl(GIT_URL)}>
        {GIT_URL}
      </Button>
    </div>
    <p className="text-center text-xs text-text-tertiary m-0 leading-relaxed">
      如有问题、建议，可以直接微信联系，或者通过插件评论区留言
    </p>
  </div>
)
