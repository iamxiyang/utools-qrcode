import { Button } from 'antd'
import { openUrl } from '../utils'
import { ReactNode } from 'react'
const GIT_URL = 'https://github.com/iamxiyang/utools-qrcode'

export const Contact: ReactNode = (
  <>
    <div className="w-530px flex items-center justify-between mt-20px">
      <div>
        <img src="./wechat.jpg" className="w-250px" alt="联系作者" />
        <p className="text-center mt-4px">微信扫码联系作者</p>
      </div>
      <div>
        <img src="./appreciate.jpg" className="w-250px" alt="赞赏作者" />
        <p className="text-center mt-4px">微信扫码支持开发</p>
      </div>
    </div>
    <div>
      该插件开源，开源地址
      <Button type="link" onClick={() => openUrl(GIT_URL)}>
        {GIT_URL}
      </Button>
    </div>
    <p className="mt-4px">如有问题、建议，可以直接微信联系，或者通过github提issue、插件评论区留言</p>
  </>
)
