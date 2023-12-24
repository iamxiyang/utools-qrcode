import { useDark } from './useDark'

export const useTheme = () => {
  const isDark = useDark()
  const currentTheme = isDark ? 'dark' : 'light'
  return currentTheme
}
