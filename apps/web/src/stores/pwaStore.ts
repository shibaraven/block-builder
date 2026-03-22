import { create } from 'zustand'

interface PwaStore {
  isOnline: boolean
  isInstallable: boolean
  isInstalled: boolean
  updateAvailable: boolean
  deferredPrompt: any
  setOnline: (v: boolean) => void
  setInstallable: (prompt: any) => void
  setInstalled: () => void
  setUpdateAvailable: (v: boolean) => void
  install: () => Promise<boolean>
  dismissInstall: () => void
}

export const usePwaStore = create<PwaStore>((set, get) => ({
  isOnline: navigator.onLine,
  isInstallable: false,
  isInstalled: window.matchMedia('(display-mode: standalone)').matches,
  updateAvailable: false,
  deferredPrompt: null,

  setOnline: (v) => set({ isOnline: v }),
  setInstallable: (prompt) => set({ isInstallable: true, deferredPrompt: prompt }),
  setInstalled: () => set({ isInstalled: true, isInstallable: false }),
  setUpdateAvailable: (v) => set({ updateAvailable: v }),
  dismissInstall: () => set({ isInstallable: false }),

  install: async () => {
    const { deferredPrompt } = get()
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      set({ isInstalled: true, isInstallable: false, deferredPrompt: null })
      return true
    }
    return false
  },
}))

// ─── Initialize PWA event listeners ──────────────────────────────────
export function initPwa() {
  const store = usePwaStore.getState()

  // Online/offline
  window.addEventListener('online',  () => store.setOnline(true))
  window.addEventListener('offline', () => store.setOnline(false))

  // Install prompt
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault()
    store.setInstallable(e)
  })

  window.addEventListener('appinstalled', () => {
    store.setInstalled()
  })
}
