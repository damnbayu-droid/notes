import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SEOProvider } from '@/providers/SEOProvider'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Global Error Listener for early boot failures
window.addEventListener('error', (event) => {
  console.error('Global boot error:', event.error);
  handleCriticalError();
});

// Async Error Listener for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled async rejection:', event.reason);
  // Optional: Only trigger critical UI if it's a known boot-blocking failure
  if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
    handleCriticalError();
  }
});

function handleCriticalError() {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff; color: #000; font-family: sans-serif; text-align: center; padding: 20px;">
        <div>
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Smart Notes Internal Error</h1>
          <p style="color: #666; margin-bottom: 20px;">We encountered a critical error during startup or a network failure.</p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="window.location.reload()" style="background: #7c3aed; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
              Reload Page
            </button>
            <button onclick="window.location.href='/'" style="background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
              Go Home
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <SEOProvider>
          <App />
        </SEOProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
