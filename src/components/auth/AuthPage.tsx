import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthView = 'login' | 'signup' | 'forgot-password';

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onResetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  onGoogleSignIn: () => Promise<{ success: boolean; error?: string }>;
  // onBack is used in the JSX below
  onBack: () => void;
}

export function AuthPage({ onSignIn, onSignUp, onResetPassword, onGoogleSignIn, onBack }: AuthPageProps) {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-white/50 hover:bg-white/80 backdrop-blur-md rounded-full text-sm font-medium text-gray-700 transition-all hover:shadow-lg"
      >
        ← Back to Notes
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {currentView === 'login' && (
          <LoginForm
            onSubmit={onSignIn}
            onSwitchToSignup={() => setCurrentView('signup')}
            onForgotPassword={() => setCurrentView('forgot-password')}
            onGoogleSignIn={onGoogleSignIn}
          />
        )}

        {currentView === 'signup' && (
          <SignupForm
            onSubmit={onSignUp}
            onSwitchToLogin={() => setCurrentView('login')}
            onGoogleSignIn={onGoogleSignIn}
          />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPasswordForm
            onSubmit={onResetPassword}
            onBackToLogin={() => setCurrentView('login')}
          />
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          By using this app, you agree to our{' '}
          <button className="text-violet-600 hover:text-violet-700 font-medium">
            Terms
          </button>
          {' '}and{' '}
          <button className="text-violet-600 hover:text-violet-700 font-medium">
            Privacy Policy
          </button>
        </p>
      </div>
    </div>
  );
}
