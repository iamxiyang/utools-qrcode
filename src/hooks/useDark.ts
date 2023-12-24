import { useState, useEffect } from 'react'

type ThemeEvent = (e: boolean) => void

const getThemeListenerTheme = (e: ThemeEvent) => {
  const onThemeChange = (evt: MediaQueryListEvent) => {
    e(evt.matches)
  }

  const addListenerTheme = () => {
    const mediaQueryList = matchMedia('(prefers-color-scheme: dark)')
    mediaQueryList.addEventListener('change', onThemeChange)
  }

  const removeListenerTheme = () => {
    const mediaQueryList = matchMedia('(prefers-color-scheme: dark)')
    mediaQueryList.removeEventListener('change', onThemeChange)
  }

  return {
    addListenerTheme,
    removeListenerTheme,
  }
}

export const useDark = () => {
  const [systemTheme, setTheme] = useState(utools.isDarkColors())
  const { addListenerTheme, removeListenerTheme } = getThemeListenerTheme(setTheme)

  useEffect(() => {
    addListenerTheme()

    return removeListenerTheme
  })

  return systemTheme
}
