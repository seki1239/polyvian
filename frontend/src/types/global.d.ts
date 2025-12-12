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

interface MasterDataItem {
  id: number;
  word: string;
  definition: string;
  sentence: string;
  similar_ids?: number[];
  similar_words_ids?: number[]; // 古い形式の可能性を考慮
}

interface ICard extends MasterDataItem {}

declare module '*.json' {
  const value: MasterDataItem[];
  export default value;
}