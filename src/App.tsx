import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/layout/Dashboard';
import { Toaster } from '@/components/ui/sonner';
import { AIAssistant } from '@/components/ai/AIAssistant';
import './App.css';

function App() {
  const { user, isLoading, isAuthenticated, signIn, signUp, signOut, resetPassword, signInWithGoogle, signInWithApple } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

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
          onAppleSignIn={async () => {
            const result = await signInWithApple();
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
      <Toaster position="top-center" />
    </>
  );
}

export default App;
