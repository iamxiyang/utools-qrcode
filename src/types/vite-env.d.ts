/// <reference types="vite/client" />

declare interface Window {
  preload?: typeof import('../preload')
}
