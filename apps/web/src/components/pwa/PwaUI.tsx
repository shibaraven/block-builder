import React, { useEffect } from 'react'
import { WifiOff, Download, RefreshCw, X, Smartphone } from 'lucide-react'
import { usePwaStore, initPwa } from '../../stores/pwaStore'
import { toast } from '../Toast'
import clsx from 'clsx'

// ─── Offline banner ───────────────────────────────────────────────────
export function OfflineBanner() {
  const { isOnline } = usePwaStore()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-medium shadow-lg animate-fade-in">
      <WifiOff size={13} />
      <span>離線模式 — 積木設計和代碼生成正常運作，AI 功能暫不可用</span>
    </div>
  )
}

// ─── Install prompt banner ─────────────────────────────────────────────
export function InstallBanner() {
  const { isInstallable, isInstalled, install, dismissInstall } = usePwaStore()

  if (!isInstallable || isInstalled) return null

  return (
    <div className={clsx(
      'fixed bottom-16 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-3 px-4 py-3 bg-white border border-blue-200 rounded-2xl shadow-xl',
      'animate-fade-in max-w-sm w-full mx-4'
    )}>
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Smartphone size={16} className="text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">安裝 Block Builder</p>
        <p className="text-xs text-gray-500 mt-0.5">安裝到桌面，離線也能使用</p>
      </div>
      <button
        onClick={async () => {
          const ok = await install()
          if (ok) toast.success('Block Builder 已安裝到桌面！')
        }}
        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
      >
        安裝
      </button>
      <button
        onClick={dismissInstall}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ─── Update available notification ───────────────────────────────────
export function UpdateBanner() {
  const { updateAvailable } = usePwaStore()

  if (!updateAvailable) return null

  return (
    <div className={clsx(
      'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-3 px-4 py-3 bg-white border border-green-200 rounded-2xl shadow-xl',
      'animate-fade-in'
    )}>
      <RefreshCw size={14} className="text-green-500 flex-shrink-0" />
      <p className="text-sm text-gray-700">有新版本可用</p>
      <button
        onClick={() => window.location.reload()}
        className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        立即更新
      </button>
    </div>
  )
}

// ─── PWA initializer hook ─────────────────────────────────────────────
export function usePwaInit() {
  const { setUpdateAvailable } = usePwaStore()

  useEffect(() => {
    initPwa()

    // Listen for SW update
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })
      })
    }
  }, [])
}

// ─── Offline capability indicator (in Toolbar) ───────────────────────
export function PwaStatusBadge() {
  const { isOnline, isInstalled, isInstallable, install } = usePwaStore()

  return (
    <div className="flex items-center gap-1.5">
      {/* Online/offline dot */}
      <div
        title={isOnline ? '已連線' : '離線模式'}
        className={clsx(
          'w-2 h-2 rounded-full transition-colors',
          isOnline ? 'bg-green-400' : 'bg-amber-400 animate-pulse'
        )}
      />

      {/* Install button if not installed */}
      {isInstallable && !isInstalled && (
        <button
          onClick={() => install()}
          title="安裝到桌面"
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Download size={11} />
          <span className="hidden lg:block">安裝</span>
        </button>
      )}

      {/* Installed badge */}
      {isInstalled && (
        <span className="text-xs text-green-600 hidden lg:block" title="已安裝為桌面 App">
          ✓ App
        </span>
      )}
    </div>
  )
}
