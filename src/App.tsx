import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/layout/Dashboard';
import { Toaster } from '@/components/ui/sonner';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { GuestNagModal } from '@/components/auth/GuestNagModal';
import { useTheme } from '@/hooks/useTheme';
import './App.css';

// Lazy load SharedNoteView for better initial load performance
const SharedNoteView = lazy(() => import('@/components/notes/SharedNoteView'));
const PrivacyPage = lazy(() => import('@/components/legal/PrivacyPage'));
const TermsPage = lazy(() => import('@/components/legal/TermsPage'));

function MainApp() {
  const { user, isLoading, isAuthenticated, signIn, signUp, signOut, resetPassword, signInWithGoogle } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

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
    // Request permission on load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

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
            new Notification(`Reminder: ${note.title}`, {
              body: note.content.substring(0, 50) || 'You have a note reminder.',
              icon: '/vite.svg'
            });
          }
        }
      });
    };

    const intervalId = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(intervalId);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated AND auth view is requested
  if (!isAuthenticated && showAuth) {
    return (
      <>
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
        <Toaster position="top-center" />
      </>
    );
  }

  // Show dashboard (Authenticated OR Guest)
  return (
    <>
      <Dashboard
        user={user}
        onSignOut={signOut}
        onSignIn={() => setShowAuth(true)}
      />
      <AIAssistant />
      <GuestNagModal onSignupClick={() => setShowAuth(true)} />
      <Toaster position="top-center" />
    </>
  );
}

function App() {
  const { theme } = useTheme(); // Initialize theme logic and ensure it is used
  return (
    <div className={theme}>
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
