import { ErrorBoundary } from './components/ErrorBoundary'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import { initTheme } from './stores/themeStore'
import { useAuthInit } from './components/auth/AuthUI'
import { usePwaInit } from './components/pwa/PwaUI'
import './index.css'

initTheme()

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 2 } },
})

function Root() {
  useAuthInit()
  usePwaInit()
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary><Root /></ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
