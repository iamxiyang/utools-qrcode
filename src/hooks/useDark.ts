import { useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from 'react'

export const useDark = () => {
  const [systemTheme, setTheme] = useState(utools.isDarkColors())

  const onThemeChange = useCallback((evt: MediaQueryListEvent) => {
    setTheme(evt.matches)
  }, [])

  const { addListenerTheme, removeListenerTheme } = useMemo(() => {
    const addListenerTheme = () => {
      const mediaQueryList = matchMedia('(prefers-color-scheme: dark)')
      mediaQueryList.addEventListener('change', onThemeChange)
    }

    const removeListenerTheme = () => {
      const mediaQueryList = matchMedia('(prefers-color-scheme: dark)')
      mediaQueryList.removeEventListener('change', onThemeChange)
    }

    return { addListenerTheme, removeListenerTheme }
  }, [onThemeChange])

  useEffect(() => {
    addListenerTheme()
    return removeListenerTheme
  }, [addListenerTheme, removeListenerTheme])

  return systemTheme
}

/**
 * 返回当前主题名称 ('dark' | 'light')
 */
export const useTheme = () => {
  const isDark = useDark()
  return isDark ? 'dark' : 'light'
}

/**
 * 同步主题类到 html 元素，应该只在根组件调用一次
 * 使用 useLayoutEffect 避免视觉闪烁
 */
export const useSyncThemeClass = () => {
  const isDark = useDark()
  const isFirstSync = useRef(true)

  // 使用 useLayoutEffect 在 DOM 绘制前同步类，避免闪烁
  useLayoutEffect(() => {
    // 只在首次或 isDark 真正变化时更新
    const html = document.documentElement
    const hasDarkClass = html.classList.contains('dark')

    if (isDark && !hasDarkClass) {
      html.classList.add('dark')
    } else if (!isDark && hasDarkClass) {
      html.classList.remove('dark')
    }

    isFirstSync.current = false
  }, [isDark])
}
