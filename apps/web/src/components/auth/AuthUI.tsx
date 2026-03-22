import React, { useState, useEffect, useRef } from 'react'
import { LogIn, LogOut, User, Share2, Copy, Check, ExternalLink } from 'lucide-react'
import { useAuthStore, initiateGithubLogin, fetchCurrentUser, handleOAuthCallback, projectApi, API_BASE } from '../../lib/api'
import { useCanvasStore } from '../../stores/canvasStore'
import clsx from 'clsx'

// ─── Login Button ─────────────────────────────────────────────────────
export function LoginButton() {
  return (
    <button
      onClick={initiateGithubLogin}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      GitHub 登入
    </button>
  )
}

// ─── User Menu ────────────────────────────────────────────────────────
export function UserMenu() {
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { nodes, edges, project } = useCanvasStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleShare = async () => {
    setSharing(true)
    try {
      // Save current canvas first
      const saveRes = await projectApi.create({
        name: project.name,
        description: project.description ?? '',
        canvas: { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } },
        settings: project.settings,
        isPublic: true,
      })
      if (!saveRes.success || !saveRes.data) throw new Error('Save failed')

      const shareRes = await projectApi.share(saveRes.data.id)
      if (shareRes.success && shareRes.data) {
        setShareUrl(shareRes.data.shareUrl)
        setShareOpen(true)
      }
    } catch (e) {
      console.error('Share failed:', e)
    } finally {
      setSharing(false)
    }
  }

  const copyShare = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full border border-gray-200" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          <button
            onClick={() => { handleShare(); setOpen(false) }}
            disabled={sharing}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Share2 size={13} className="text-gray-400" />
            {sharing ? '生成分享連結...' : '分享此專案'}
          </button>

          <button
            onClick={() => { logout(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={13} />
            登出
          </button>
        </div>
      )}

      {/* Share modal */}
      {shareOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-green-200 rounded-xl shadow-xl p-4 z-50 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Share2 size={13} className="text-green-500" />
            <p className="text-xs font-semibold text-green-800">分享連結已生成！</p>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={shareUrl}
              readOnly
              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg font-mono bg-gray-50 truncate"
            />
            <button
              onClick={copyShare}
              className="px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <p className="text-xs text-gray-400">對方可以查看設計並下載代碼，但不能編輯。</p>
          <button
            onClick={() => window.open(shareUrl, '_blank')}
            className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700"
          >
            <ExternalLink size={11} /> 在新分頁開啟
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Auth initializer — call in main.tsx ─────────────────────────────
export function useAuthInit() {
  const { setLoading, token } = useAuthStore()

  useEffect(() => {
    // Handle OAuth callback first
    handleOAuthCallback()

    // Then try to restore session
    if (token) {
      setLoading(true)
      fetchCurrentUser().finally(() => setLoading(false))
    }
  }, [])
}
