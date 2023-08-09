import { useEffect, useState, useMemo, useRef } from 'react'
import { Setting } from './types'

export const useLocalStorage = <T>(cacheKey: string, initial: T): [T, (newResult: Partial<T> | T) => void] => {
  const [result, setResult] = useState(() => {
    const saved = utools.dbStorage.getItem(cacheKey)
    return saved || initial
  })

  useEffect(() => {
    utools.dbStorage.setItem(cacheKey, result)
  }, [result])

  const updateResult = (newResult: Partial<T> | T) => {
    if (!Array.isArray(newResult) && typeof newResult === 'object') {
      setResult((prevResult: T) => ({ ...prevResult, ...newResult }))
    } else {
      setResult(newResult)
    }
  }

  return [result, updateResult]
}

interface UseSetting {
  (initialSetting: Setting): [Setting, (newSetting: Partial<Setting>) => void]
}

export const useSetting: UseSetting = (initialSetting: Setting) => {
  return useLocalStorage('setting', initialSetting)
}


type ThemeEvent = (e: boolean) => void

const getThemeListenerTheme = (e: ThemeEvent) => {
  const onThemeChange = (evt: MediaQueryListEvent) => {
    e(evt.matches)
  };

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
    removeListenerTheme
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



//以下代码实现基于 https://github.com/alibaba/hooks/blob/master/packages/hooks/src/useMemoizedFn/index.ts
//用于解决使用usecallback导致的历史记录缓存问题

type noop = (this: any, ...args: any[]) => any;

type PickFunction<T extends noop> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>;

export function useMemoizedFn<T extends noop>(fn: T) {

  const fnRef = useRef<T>(fn);

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo(() => fn, [fn]);

  const memoizedFn = useRef<PickFunction<T>>();
  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}