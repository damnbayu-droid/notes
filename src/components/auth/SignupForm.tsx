import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Check } from 'lucide-react';

interface SignupFormProps {
  onSubmit: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSubmit, onSwitchToLogin }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains a special character', met: /[!@#$%^&*]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await onSubmit(email, password, name);

    if (!result.success) {
      setError(result.error || 'Failed to sign up');
      toast.error(result.error || 'Failed to sign up');
    } else {
      toast.success('Account created successfully!');
      // Check if we need to show a specific message for email confirmation
      if (result.error && result.error.includes('email')) {
        toast.info(result.error);
      }
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
            Create account
          </CardTitle>
          <CardDescription className="text-gray-500">
            Start organizing your notes today
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
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                required
              />
            </div>
          </div>

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
                placeholder="Create a strong password"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password requirements */}
            <div className="space-y-1.5 mt-2">
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${req.met ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                    <Check className={`w-2.5 h-2.5 ${req.met ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
              I agree to the{' '}
              <button type="button" className="text-violet-600 hover:text-violet-700 font-medium">
                Terms of Service
              </button>
              {' '}and{' '}
              <button type="button" className="text-violet-600 hover:text-violet-700 font-medium">
                Privacy Policy
              </button>
            </Label>
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
                Create account
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
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            Sign in
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
