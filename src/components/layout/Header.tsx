import { useState, useEffect } from 'react';
import { BaliTimeClock } from '@/components/time/BaliTimeClock';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  LogOut,
  Settings,
  User as UserIcon,
  Moon,
  Sun,
  Mic,
  Scan,
  Bell
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: (tab?: string) => void;
  onSignIn: () => void;
}

export function Header({ user, onSignOut, onToggleSidebar, onOpenSettings, onSignIn }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [dynamicStatus, setDynamicStatus] = useState<{ icon: any, text: string, type: 'info' | 'record' | 'scan' } | null>(null);

  // Listen for global events to update dynamic island
  useEffect(() => {
    const handleStatus = (e: CustomEvent) => {
      setDynamicStatus(e.detail);
      if (e.detail?.duration) {
        setTimeout(() => setDynamicStatus(null), e.detail.duration);
      }
    };
    window.addEventListener('dynamic-status' as any, handleStatus);
    return () => window.removeEventListener('dynamic-status' as any, handleStatus);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4">
        {/* Left: Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600 hidden sm:block">
            Smart Notes
          </span>
        </div>

        {/* Center: Dynamic Island & Clock */}
        <div className="flex-1 flex justify-center relative h-10 items-center">
          {/* Dynamic Island Status */}
          <div className={`
                absolute z-20 flex items-center justify-center gap-3 px-4 py-2 rounded-full transition-all duration-500 ease-spring
                ${dynamicStatus
              ? 'bg-black text-white w-auto min-w-[200px] max-w-full scale-100 shadow-xl opacity-100 translate-y-0'
              : 'bg-transparent w-auto scale-90 opacity-0 pointer-events-none -translate-y-2'
            }
            `}>
            {dynamicStatus && (
              <>
                {dynamicStatus.type === 'record' && <Mic className="w-4 h-4 text-red-500 animate-pulse" />}
                {dynamicStatus.type === 'scan' && <Scan className="w-4 h-4 text-blue-400" />}
                {dynamicStatus.type === 'info' && <Bell className="w-4 h-4 text-yellow-400" />}
                <span className="text-sm font-medium whitespace-nowrap">{dynamicStatus.text}</span>
              </>
            )}
          </div>

          {/* Default: Bali Time Clock */}
          <div className={`transition-all duration-300 ease-in-out transform ${dynamicStatus ? 'opacity-0 scale-90 blur-sm pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
            <BaliTimeClock />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Smart Mode / Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full" aria-label="Toggle theme">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-violet-100 dark:ring-violet-900" aria-label="Open user menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenSettings('profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenSettings('security')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={onSignIn}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
              aria-label="Sign in"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
