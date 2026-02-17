import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<{ success: boolean; error?: string }>;
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onSubmit, onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await onSubmit(email);
    
    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
    
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
              Check your email
            </CardTitle>
            <CardDescription className="text-gray-500">
              We've sent a password reset link to{' '}
              <span className="font-medium text-gray-700">{email}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 text-center">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              try again
            </button>
          </p>
          <Button
            onClick={onBackToLogin}
            variant="outline"
            className="w-full h-12"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="space-y-4 text-center pb-8">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Reset password
          </CardTitle>
          <CardDescription className="text-gray-500">
            Enter your email and we'll send you a reset link
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>

        <Button
          onClick={onBackToLogin}
          variant="ghost"
          className="w-full h-12 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to sign in
        </Button>
      </CardContent>
    </Card>
  );
}
