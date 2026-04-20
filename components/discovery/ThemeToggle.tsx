'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-10 h-10" />

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 rounded-xl border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm"
    >
      {theme === 'dark' ? (
        <Moon className="w-4 h-4 text-violet-400" />
      ) : (
        <Sun className="w-4 h-4 text-orange-500" />
      )}
    </Button>
  )
}
