import React from 'react'

interface State { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[Block Builder Error]', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fafaf8', fontFamily: 'system-ui, sans-serif', padding: 24,
      }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⊞</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111', marginBottom: 8 }}>
            Block Builder 遇到問題
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            發生了未預期的錯誤。你的積木資料已自動儲存在 localStorage，重新整理後可以繼續。
          </p>

          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12,
            padding: '12px 16px', marginBottom: 24, textAlign: 'left',
          }}>
            <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#b91c1c', wordBreak: 'break-all' }}>
              {this.state.error?.message}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', background: '#185FA5', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              🔄 重新整理
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('canvas-store')
                window.location.reload()
              }}
              style={{
                padding: '10px 24px', background: 'white', color: '#666',
                border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              🗑 清除並重置
            </button>
          </div>

          {this.state.errorInfo && (
            <details style={{ marginTop: 24, textAlign: 'left' }}>
              <summary style={{ fontSize: 12, color: '#999', cursor: 'pointer' }}>技術細節</summary>
              <pre style={{
                marginTop: 8, padding: 12, background: '#f3f4f6', borderRadius: 8,
                fontSize: 11, overflow: 'auto', color: '#374151', maxHeight: 200,
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
