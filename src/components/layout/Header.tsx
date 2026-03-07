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
  Bell,
  X,
  CheckCircle2,
  Mic,
  Scan,
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

    window.addEventListener('dcpi-status' as any, handleStatus);
    window.addEventListener('dcpi-notification' as any, handleNotification);

    return () => {
      window.removeEventListener('dynamic-status' as any, handleStatus);
      window.removeEventListener('dcpi-notification' as any, handleNotification);
    };
  }, []);

  // Determine container state
  const isActive = !!dynamicStatus || !!notification;

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
                absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center transition-all duration-500 ease-fluid shadow-xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                ${isActive
                ? 'bg-black text-white px-3 py-1.5 sm:px-4 sm:py-2 gap-1.5 min-w-[200px] sm:min-w-[280px] max-w-[90vw] rounded-2xl' // Active/Notification State (Black Pill)
                : 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-100 px-3 sm:px-5 gap-1.5 sm:gap-2 min-w-[140px] sm:min-w-[200px] max-w-[90vw] rounded-full h-8 sm:h-10' // Default State
              }
              `}
            onClick={onOpenAlarm}
          >
            {/* 
                Content Management:
                1. Dynamic Status (Mic/Scan) -> Replaces everything, Single Row.
                2. Notification -> Center-Top Overlay.
                3. Default -> Clock only.
             */}

            {/* Case 1: Dynamic Status (Mic/Scan) overrides everything */}
            {dynamicStatus && (
              <div className="flex items-center gap-2 sm:gap-3 animate-in fade-in zoom-in duration-300">
                {dynamicStatus.type === 'record' && <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 animate-pulse" />}
                {dynamicStatus.type === 'scan' && <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />}
                {dynamicStatus.type === 'info' && <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />}
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{dynamicStatus.text}</span>
              </div>
            )}

            {/* Case 2 & 3: Clock + Centered Notification Overlay (Stable Container) */}
            {!dynamicStatus && (
              <div className="flex flex-col items-center">
                {/* Clock Row - Always Stable */}
                <div className="flex items-center gap-2 sm:gap-3 h-8 sm:h-10 transition-all duration-300">
                  <BaliTimeClock headless />
                  <div className="h-3 sm:h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1" />
                  <div className="p-1 rounded-full text-violet-600 dark:text-violet-300 flex items-center gap-1 sm:gap-1.5">
                    <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Alarm</span>
                  </div>
                </div>

                {/* Floating Notification Overlay - Appears smoothly below Dynamic Island */}
                {notification && (
                  <div
                    className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-6 fade-in duration-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAlarm(); // Click notification to open center
                    }}
                  >
                    <div className="bg-black/95 backdrop-blur-md text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-white/10 min-w-[260px] sm:min-w-[320px] max-w-[95vw] flex items-center gap-3 sm:gap-4 group cursor-pointer hover:bg-black transition-all">
                      <div className="p-1.5 sm:p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                        {notification.type === 'error' && <X className="w-4 h-4 text-red-500" />}
                        {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {(!notification.type || notification.type === 'info') && <Bell className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs sm:text-sm font-bold leading-tight">{notification.title}</span>
                        {notification.message && (
                          <span className="text-[10px] sm:text-xs text-white/70 leading-tight mt-0.5 truncate max-w-[180px] sm:max-w-[240px]">
                            {notification.message}
                          </span>
                        )}
                      </div>
                      <div className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="text-[8px] sm:text-[10px] font-bold text-violet-400 uppercase tracking-widest">View</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Smart Mode / Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
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
              className="bg-violet-600 hover:bg-violet-700 text-white !rounded-xl px-6 min-h-[36px]"
              aria-label="Sign in"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header >
  );
}
