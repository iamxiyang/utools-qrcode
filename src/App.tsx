import React, { useState, useEffect } from 'react'
import type { QRCodeProps } from 'antd';
import { Input, QRCode, FloatButton, Drawer, Button, Space, Switch, message, Segmented, ColorPicker } from 'antd';
import { MenuOutlined, SettingOutlined, ScanOutlined, CopyOutlined, CheckCircleTwoTone, DownloadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

function App() {

  interface Element {
    id: number;
    text: string;
  }

  interface Setting {
    isSaveHistory: boolean;
    isDecodeReplication: boolean;
    isAutoCopyCode: boolean,
    imageAddressInQrCode: string,
    iconSize: number | undefined,
    qrCodeSize: number | undefined,
    qrCodeColor: string,
    qrCodeBgColor: string,
    isQrCodeBorder: boolean,
    level: string
  }

  const [text, setText] = React.useState('-');
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Setting>({
    isSaveHistory: false,
    isDecodeReplication: false,
    isAutoCopyCode: false,
    imageAddressInQrCode: '',
    iconSize: 40,
    qrCodeSize: 160,
    qrCodeColor: '#000000',
    qrCodeBgColor: 'transparent',
    isQrCodeBorder: true,
    level: 'L'
  })
  const [analyzeHistory, setAnalyzeHistory] = useState<Element[]>([
    {
      id: 1,
      text: 'hello, world!'
    },
    {
      id: 2,
      text: 'hello, 小何!'
    }
  ])

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const copyToClipboard = (text:string) => {
    navigator.clipboard.writeText(text)
      .then(function () {
        message.info({ icon: <CheckCircleTwoTone />, content: '内容已复制到剪贴板' });
      })
      .catch(function (err) {
        message.info('复制失败，请重试');
      });
  }

  const copyText = (text:string) => {
    copyToClipboard(text);
  }

  const downloadQRCode = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    try {
      if (canvas) {
        const url = canvas.toDataURL();
        const a = document.createElement('a');
        a.download = 'QRCode.png';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        message.info({ icon: <CheckCircleTwoTone />, content: '二维码下载成功' });
      }
    } catch (ex) {
      message.info('二维码下载失败');
    }
  };

  useEffect(() => {
    //TODO 在这里进行用户设置的持久化存储
  }, [settings]);

  const switchChange = (e: string) => {
    if (e == 'isSaveHistory') {
      setSettings({ ...settings, isSaveHistory: !settings.isSaveHistory });
    }
    if (e == 'isDecodeReplication') {
      setSettings({ ...settings, isDecodeReplication: !settings.isDecodeReplication });
    }
    if (e == 'isAutoCopyCode') {
      setSettings({ ...settings, isAutoCopyCode: !settings.isAutoCopyCode });
    }
  }

  const imageAddressInQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, imageAddressInQrCode: e.target.value })
  }

  const iconSizeChange = (e: any) => {
    setSettings({ ...settings, iconSize: e.target.value })
  }

  const qrCodeSizeChange = (e: any) => {
    setSettings({ ...settings, qrCodeSize: e.target.value })
  }

  const qrCodeColorChange = (e: any) => {
    setSettings({ ...settings, qrCodeColor: e.toHexString() })
  }
  
  const qrCodeBgColorChange = (e: any) => {
    setSettings({ ...settings, qrCodeBgColor: e.toHexString() })
  }

  const QrCodeBorderChange = (e:boolean) => {
    setSettings({ ...settings, isQrCodeBorder: e })
  }

  const levelChange = (e: any) => {
    setSettings({ ...settings, level: e })
  }

  return <div className="position-fixed top-0 right-0 bottom-0 left-0 flex">
    <div className='flex-1'>
      <div className='h-50% w-100%'>
        <TextArea
          showCount
          maxLength={500}
          className='h-100% w-100%'
          style={{ resize: 'none' }}
          onChange={onChange}
          placeholder="请输入内容或粘贴二维码"
        />
      </div>
      <div className='h-50% w-100% flex flex-items-center flex-justify-center overflow-hidden'>
        <div className='qrcode-box'>
          <div className='overlay'>
            <Button onClick={downloadQRCode} shape="round" icon={<DownloadOutlined />} size={'large'} />
          </div>
          <QRCode
            size={settings.qrCodeSize}
            icon={settings.imageAddressInQrCode}
            iconSize={settings.iconSize}
            color={settings.qrCodeColor}
            bgColor={settings.qrCodeBgColor}
            errorLevel={settings.level as QRCodeProps['errorLevel']}
            bordered={settings.isQrCodeBorder}
            value={text || '-'} />
        </div>
      </div>
    </div>
    <div className='w-30% h-100% bg-#f9f9f9 overflow-y-auto overflow-x: hidden; p-t-8px'>
      {analyzeHistory.map((item) => (
        <div key={item.id} className='copy-box min-h-40px bg-#fcfcfc b-solid b-1 p-4px flex font-size-14px m-b-8px border-#ddd cursor-text'>
          <div className='w-90%'>{item.text}</div>
        <div className='copy-button w-10% flex flex-items-center flex-justify-center'>
            <CopyOutlined onClick={() => copyText(item.text)} className='cursor-pointer' />
        </div>
      </div>
      ))}
    </div>
    <FloatButton.Group
      trigger="hover"
      style={{ right: 24 }}
      icon={<MenuOutlined />}
    >
      <FloatButton icon={ <ScanOutlined /> } />
      <FloatButton onClick={showDrawer} icon={ <SettingOutlined /> } />
    </FloatButton.Group>
    <Drawer title="设置" placement="right" onClose={onClose} open={open}>
      <Space>
        <Switch checkedChildren="开启" onChange={() => switchChange('isSaveHistory')} unCheckedChildren="关闭" defaultChecked={ settings.isSaveHistory } />
        <div className='m-l-15px'>是否保存解析历史</div>
      </Space>
      <br />
      <Space className='m-t-15px'>
        <Switch checkedChildren="开启" onChange={() => switchChange('isDecodeReplication')} unCheckedChildren="关闭" defaultChecked={ settings.isDecodeReplication } />
        <div className='m-l-20px'>解码自动复制</div>
      </Space>
      <Space className='m-t-15px'>
        <Switch checkedChildren="开启" onChange={() => switchChange('isAutoCopyCode')} unCheckedChildren="关闭" defaultChecked={ settings.isAutoCopyCode } />
        <div className='m-l-20px'>二维码图片自动复制</div>
      </Space>
      <Space className='position-absolute left-20px bottom-20px'>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onClose} type='primary'>确定</Button>
      </Space>
      <div className='disposition-box'>
        <div className='disposition-title'>
          二维码中图片的地址（ 目前只支持图片地址 ）
        </div>
        <div className='disposition-content'>
          <Input value={settings.imageAddressInQrCode} onChange={ imageAddressInQrCodeChange } placeholder="请输入图片地址" />
        </div>
      </div>
      <div className='disposition-box'>
        <div className='disposition-title'>
          二维码中图片大小 （ 默认值为40 ）
        </div>
        <div className='disposition-content'>
          <Input onChange={iconSizeChange} value={settings.iconSize} />
        </div>
      </div>
      <div className='disposition-box'>
        <div className='disposition-title'>
          二维码大小 （ 默认值为160 ）
        </div>
        <div className='disposition-content'>
          <Input value={settings.qrCodeSize} onChange={ qrCodeSizeChange } />
        </div>
      </div>
      <div className='disposition-box'>
        <div className='disposition-title'>
          二维码颜色 （ 默认值为#000 ）
        </div>
        <div className='disposition-content'>
          <ColorPicker defaultValue={settings.qrCodeColor} onChange={qrCodeColorChange} size="small" showText />
        </div>
      </div>
      <div className='disposition-box'>
        <div className='disposition-title'>
          二维码背景颜色 （ 默认值为transparent ）
        </div>
        <div className='disposition-content'>
          <ColorPicker defaultValue={settings.qrCodeBgColor} onChange={qrCodeBgColorChange} size="small" showText />
        </div>
      </div>
      <Space className='m-t-15px'>
        <Switch checkedChildren="开启" onChange={QrCodeBorderChange} unCheckedChildren="关闭" defaultChecked={settings.isQrCodeBorder} />
        <div className='m-l-20px'>是否有边框</div>
      </Space>
      <div className='disposition-box'>
        <div className='disposition-title'>
          二维码纠错等级 （ 默认值为 L ）
        </div>
        <div className='disposition-content'>
          <Segmented value={settings.level} onChange={ levelChange } options={['L', 'M', 'Q', 'H']} />
        </div>
      </div>
    </Drawer>
  </div>
}

export default App
