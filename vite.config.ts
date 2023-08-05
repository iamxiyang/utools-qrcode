import { defineConfig } from 'vite'
import React from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import presetWind from '@unocss/preset-wind'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    minify: true,
    target: 'es2019',
  },
  plugins: [
    UnoCSS({
      shortcuts: [{ logo: 'i-logos-react w-6em h-6em transform transition-800 hover:rotate-180' }],
      presets: [presetWind()],
    }),
    React(),
  ],
})
