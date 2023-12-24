export const openUrl = (url: string) => {
  window.utools ? utools.shellOpenExternal(url) : window.open(url, '_blank')
}

export const copyText = (text: string) => {
  window.utools ? utools.copyText(text) : navigator.clipboard.writeText(text)
}

export const copyImage = (img: string) => {
  utools.copyImage(img)
}

// 10 秒以内显示刚刚
// 1 分钟以内显示秒
// 其余显示年月日时分秒
export const formatTime = (time: number | string | Date) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 10000) {
    return '刚刚'
  } else {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = `0${date.getHours()}`.slice(-2)
    const minute = `0${date.getMinutes()}`.slice(-2)
    const second = `0${date.getSeconds()}`.slice(-2)
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }
}
