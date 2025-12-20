import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3()],

  // 自定义主题，映射到 CSS 变量
  theme: {
    colors: {
      // 主色
      primary: {
        DEFAULT: 'var(--color-primary)',
        hover: 'var(--color-primary-hover)',
        active: 'var(--color-primary-active)',
        light: 'var(--color-primary-light)',
        glow: 'var(--color-primary-glow)',
      },
      // 状态色
      success: {
        DEFAULT: 'var(--color-success)',
        bg: 'var(--color-success-bg)',
      },
      error: {
        DEFAULT: 'var(--color-error)',
        bg: 'var(--color-error-bg)',
      },
      warning: {
        DEFAULT: 'var(--color-warning)',
        bg: 'var(--color-warning-bg)',
      },
      info: {
        DEFAULT: 'var(--color-info)',
        bg: 'var(--color-info-bg)',
      },
      // 背景色
      bg: {
        DEFAULT: 'var(--color-bg)',
        secondary: 'var(--color-bg-secondary)',
        tertiary: 'var(--color-bg-tertiary)',
        elevated: 'var(--color-bg-elevated)',
        blur: 'var(--color-bg-blur)',
      },
      // 文字色
      text: {
        DEFAULT: 'var(--color-text)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
      },
      // 边框色
      border: {
        DEFAULT: 'var(--color-border)',
        light: 'var(--color-border-light)',
      },
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      full: 'var(--radius-full)',
    },
    boxShadow: {
      xs: 'var(--shadow-xs)',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      primary: 'var(--shadow-primary)',
    },
  },

  // 自定义快捷方式
  shortcuts: {
    // 基础布局
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',
  },

  // 安全列表
  safelist: [
    'dark',
  ],
})
