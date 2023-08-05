import { useEffect, useState } from 'react'
import { Setting } from './types'

export const useLocalStorage = <T>(cacheKey: string, initial: T): [T, (newResult: Partial<T> | T) => void] => {
  const [result, setResult] = useState(initial)

  useEffect(() => {
    const saved = utools.dbStorage.getItem(cacheKey)
    if (saved) {
      setResult(saved)
    }
  }, [])

  useEffect(() => {
    utools.dbStorage.setItem(cacheKey, result)
  }, [result])

  const updateResult = (newResult: Partial<T> | T) => {
    if (!Array.isArray(newResult) && typeof newResult === 'object') {
      setResult(prevResult => ({ ...prevResult, ...newResult }))
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
