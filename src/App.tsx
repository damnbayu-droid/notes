import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';


import { useTheme } from '@/hooks/useTheme';
import { SEO } from '@/components/seo/SEO';
import { Spinner } from '@/components/ui/spinner';
import './App.css';

// Lazy load all major components
const Dashboard = lazy(() => import('@/components/layout/Dashboard').then(module => ({ default: module.Dashboard })));
const AuthPage = lazy(() => import('@/components/auth/AuthPage').then(module => ({ default: module.AuthPage })));
const AIAssistant = lazy(() => import('@/components/ai/AIAssistant').then(module => ({ default: module.AIAssistant })));
const GuestNagModal = lazy(() => import('@/components/auth/GuestNagModal').then(module => ({ default: module.GuestNagModal })));

// Lazy load Secondary Pages
const SharedNoteView = lazy(() => import('@/components/notes/SharedNoteView'));
const PrivacyPage = lazy(() => import('@/components/legal/PrivacyPage'));
const TermsPage = lazy(() => import('@/components/legal/TermsPage'));

function MainApp() {
  const { user, isLoading, isAuthenticated, signIn, signUp, signOut, resetPassword, signInWithGoogle } = useAuth();
  // Removed global useNotes(user) call here as it's already handled inside lazy-loaded Dashboard.
  // This reduces dispatcher overhead during initialization.
  const [showAuth, setShowAuth] = useState(false);

  // ... (Effects remain same) ...


  // Register Service Worker for offline support
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }, []);

  // Notification Logic
  useEffect(() => {
    // Automatic permission request removed to improve page speed and prevent blocking
    /*
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    */

    const checkReminders = () => {
      const savedNotes = localStorage.getItem('notes');
      if (!savedNotes) return;

      let notes = [];
      try {
        notes = JSON.parse(savedNotes);
      } catch (e) {
        console.error('Failed to parse notes:', e);
        return;
      }
      const now = new Date();

      if (!Array.isArray(notes)) return;

      notes.forEach((note: any) => {
        if (note.reminder_date) {
          const reminderTime = new Date(note.reminder_date);
          const diff = now.getTime() - reminderTime.getTime();
          // Check if due within the last 30 seconds to catch it once
          if (diff > 0 && diff < 30000) {
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
              detail: {
                title: `Reminder: ${note.title}`,
                message: note.content.substring(0, 50) || 'You have a note reminder.',
                type: 'info'
              }
            }));
          }
        }
      });
    };

    const intervalId = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(intervalId);
  }, []);

  // Show loading state - Optimized to be less intrusive, but provide feedback
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing Smart Notes...</p>
        <div className="mt-8 flex flex-col items-center gap-2 animate-in fade-in duration-1000 slide-in-from-bottom-2">
          <p className="text-xs text-muted-foreground opacity-50">Taking too long?</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated AND auth view is requested
  if (!isAuthenticated && showAuth) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }>
        <AuthPage
          onSignIn={async (email, password) => {
            const result = await signIn(email, password);
            if (result.success) setShowAuth(false);
            return result;
          }}
          onSignUp={async (email, password, name) => {
            const result = await signUp(email, password, name);
            if (result.success) setShowAuth(false);
            return result;
          }}
          onResetPassword={resetPassword}
          onGoogleSignIn={async () => {
            const result = await signInWithGoogle();
            if (result.success) setShowAuth(false);
            return result;
          }}
          onBack={() => setShowAuth(false)}
        />

      </Suspense>
    );
  }

  // Show dashboard (Authenticated OR Guest)
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    }>
      <Dashboard
        user={user}
        onSignOut={signOut}
        onSignIn={() => setShowAuth(true)}
      />
      <AIAssistant />
      <GuestNagModal onSignupClick={() => setShowAuth(true)} />

    </Suspense>
  );
}

function App() {
  const { theme } = useTheme(); // Initialize theme logic and ensure it is used
  return (
    <div className={theme}>
      <SEO />
      <Routes>
        <Route
          path="/share/:id"
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            }>
              <SharedNoteView />
            </Suspense>
          }
        />
        <Route
          path="/s/:slug"
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            }>
              <SharedNoteView />
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            }>
              <PrivacyPage />
            </Suspense>
          }
        />
        <Route
          path="/term"
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            }>
              <TermsPage />
            </Suspense>
          }
        />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </div>
  );
}

export default App;
