import { defineConfig } from 'vite'
import React from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import presetWind from '@unocss/preset-wind'
import { createPreloadPlugin } from 'vite-plugin-utools-helper'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    minify: true,
    target: 'es2019',
  },
  plugins: [
    UnoCSS({
      presets: [presetWind()],
    }),
    React(),
    createPreloadPlugin({
      path: 'src/preload.ts', // 修改 preload.ts 的路径
    }),
  ],
})
