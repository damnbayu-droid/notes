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
  Bell,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: (tab?: string) => void;
  onSignIn: () => void;
  onOpenAlarm: () => void;
}

export function Header({ user, onSignOut, onToggleSidebar, onOpenSettings, onSignIn, onOpenAlarm }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  // dynamicStatus = Active modes like Mic/Scan (Replaces Clock)
  const [dynamicStatus, setDynamicStatus] = useState<{ icon: any, text: string, type: 'info' | 'record' | 'scan' } | null>(null);
  // notification = Transient messages (Stacks below Clock)
  const [notification, setNotification] = useState<{ title: string, message?: string, type?: 'success' | 'error' | 'info' } | null>(null);

  // Listen for global events
  useEffect(() => {
    const handleStatus = (e: CustomEvent) => {
      setDynamicStatus(e.detail);
      if (e.detail?.duration) {
        setTimeout(() => setDynamicStatus(null), e.detail.duration);
      }
    };

    const handleNotification = (e: CustomEvent) => {
      setNotification(e.detail);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener('dynamic-status' as any, handleStatus);
    window.addEventListener('dcpi-notification' as any, handleNotification);

    return () => {
      window.removeEventListener('dynamic-status' as any, handleStatus);
      window.removeEventListener('dcpi-notification' as any, handleNotification);
    };
  }, []);

  // Determine container state
  const isActive = !!dynamicStatus || !!notification;
  const isStacked = !!notification && !dynamicStatus; // Stack only if not in active mode (mic/scan)

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

        {/* Center: Dynamic Island (Unified) */}
        <div className="flex-1 flex justify-center relative h-14 items-center">
          <div
            className={`
                relative z-20 flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl overflow-hidden
                ${isActive
                ? 'bg-black text-white' // Active State (Black Pill)
                : 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-100' // Default State
              }
                ${isStacked
                ? 'rounded-3xl px-6 py-3 gap-2 min-w-[300px] max-w-[90vw]' // Stacked (Taller)
                : 'rounded-full px-6 py-2 gap-3 min-w-[240px] max-w-[90vw]' // Single Row (Pill)
              }
              `}
          >
            {/* 
                Content Management:
                1. Dynamic Status (Mic/Scan) -> Replaces everything, Single Row.
                2. Notification -> Stacks below Clock.
                3. Default -> Clock only.
             */}

            {/* Case 1: Dynamic Status (Mic/Scan) overrides everything */}
            {dynamicStatus && (
              <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                {dynamicStatus.type === 'record' && <Mic className="w-4 h-4 text-red-500 animate-pulse" />}
                {dynamicStatus.type === 'scan' && <Scan className="w-4 h-4 text-blue-400" />}
                {dynamicStatus.type === 'info' && <Bell className="w-4 h-4 text-yellow-400" />}
                <span className="text-sm font-medium whitespace-nowrap">{dynamicStatus.text}</span>
              </div>
            )}

            {/* Case 2 & 3: Clock + Optional Notification */}
            {!dynamicStatus && (
              <>
                {/* Clock Row */}
                <div className={`flex items-center gap-3 transition-all duration-300`}>
                  <BaliTimeClock headless />
                  <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
                  <button
                    onClick={onOpenAlarm}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-violet-600 dark:text-violet-300"
                    aria-label="Set Alarm"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>

                {/* Notification Row (Stacked) */}
                {notification && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 mt-1 pb-1">
                    {notification.type === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {(!notification.type || notification.type === 'info') && <Bell className="w-4 h-4 text-blue-400" />}
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold leading-tight">{notification.title}</span>
                      {notification.message && <span className="text-xs opacity-80 leading-tight">{notification.message}</span>}
                    </div>
                  </div>
                )}
              </>
            )}
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
