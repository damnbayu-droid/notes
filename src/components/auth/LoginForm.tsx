import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => Promise<{ success: boolean; error?: string }>;
  onAppleSignIn: () => Promise<{ success: boolean; error?: string }>;
}

export function LoginForm({ onSubmit, onSwitchToSignup, onForgotPassword, onGoogleSignIn, onAppleSignIn }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await onSubmit(email, password);

    if (!result.success) {
      setError(result.error || 'Failed to sign in');
      toast.error(result.error || 'Failed to sign in');
    } else {
      toast.success('Welcome back!');
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="space-y-4 text-center pb-8">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back
          </CardTitle>
          <CardDescription className="text-gray-500">
            Sign in to access your notes
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              setIsLoading(true);
              const result = await onGoogleSignIn();
              if (!result.success) {
                toast.error(result.error);
                setIsLoading(false);
              }
            }}
            className="w-full h-10 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
            type="button"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
            type="button"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              const result = await onAppleSignIn();
              if (!result.success) {
                toast.error(result.error);
                setIsLoading(false);
              }
            }}
          >
            <svg className="w-5 h-5 mr-2 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.39-1.09-.52-2.04-.48-3.24 0-1.44.57-2.2.96-3.06.4C6.48 20.26 3.52 14.07 5.86 9.8c1.17-2.13 3.23-2.4 4.41-1.04.59.68 1.49.86 2.4.03 1.29-1.18 3.52-1.33 4.67-.18 2 .98 2.68 2.62 2.76 2.74-.03.02-2.27 1.22-2.31 4.79-.04 3.73 3.19 5.09 3.29 5.09-.03.11-.47 1.57-1.54 3.09-1.02 1.44-2.05 2.48-3.25 2.48-.3 0-.6-.04-.89-.09-1.57 0-2.3 1.05-3.41 1.55zM12.03 7.25c-.14-2.43 1.83-4.68 4.09-4.8 1.16-.06 2.68 1.13 2.5 3.58-.17 2.38-2.2 4.63-4.14 4.54-1.25-.06-2.32-1.29-2.45-3.32z" />
            </svg>
            Apple
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            Create one
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
