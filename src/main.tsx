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
  // Optionally redirect to a simple error page if root is blank
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff; color: #000; font-family: sans-serif; text-align: center; padding: 20px;">
        <div>
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Unable to load application</h1>
          <p style="color: #666; margin-bottom: 20px;">We encountered a critical error during startup.</p>
          <button onclick="window.location.reload()" style="background: #000; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
});

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
