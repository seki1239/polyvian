// frontend/src/types/global.d.ts

interface Window {
  webkitAudioContext?: typeof AudioContext;
}

declare module 'virtual:pwa-register' {
  export type RegisterSWOptions = {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export function registerSW(
    options?: RegisterSWOptions
  ): (reloadPage?: boolean) => Promise<void>
}

declare module '*.json' {
  const value: any; // JSONファイルの内容はany型として扱う
  export default value;
}