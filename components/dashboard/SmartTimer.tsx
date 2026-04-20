'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Timer, X, Play, Pause, RotateCcw, Zap, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SmartTimer() {
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(1500) // Default 25 mins
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('open-timer-modal', handleOpen)
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      window.removeEventListener('open-timer-modal', handleOpen)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    let interval: any = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      setIsFinished(true)
      window.dispatchEvent(new CustomEvent('dcpi-notification', {
        detail: {
          title: 'Neural Cycle Complete',
          message: 'Optimization phase finished. Recommendation: 5min cooldown.',
          type: 'success'
        }
      }))
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const toggleTimer = () => setIsActive(!isActive)
  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(1500)
    setIsFinished(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        ref={cardRef}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group"
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 z-50 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ml-auto flex items-center justify-center cursor-pointer"
          aria-label="Close Timer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center space-y-12 relative z-10">
          <div className="w-20 h-20 bg-violet-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-violet-500/30 animate-pulse">
            <Timer className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Smart <span className="text-violet-600">Timer</span></h2>
            <div className="flex items-center gap-3 justify-center">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Cycle Active</span>
            </div>
          </div>

          <div className="relative">
             <div className="text-8xl font-black tracking-tighter text-slate-900 dark:text-white italic tabular-nums">
               {formatTime(timeLeft)}
             </div>
             {isFinished && (
                <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-2 rounded-full animate-bounce">
                  <Bell className="w-4 h-4" />
                </div>
             )}
          </div>

          <div className="flex items-center gap-6">
            <Button 
               onClick={toggleTimer}
               className={`h-20 w-20 rounded-[2rem] transition-all active:scale-95 shadow-2xl ${isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-500/40'}`}
            >
              {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
            
            <Button 
               variant="outline"
               onClick={resetTimer}
               className="h-20 w-20 rounded-[2rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xl transition-all active:scale-95"
            >
              <RotateCcw className="w-8 h-8" />
            </Button>
          </div>

          <div className="flex gap-3">
             {[300, 1500, 3000].map((s) => (
                <button 
                  key={s}
                  onClick={() => { setTimeLeft(s); setIsActive(false); }}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeLeft === s ? 'bg-violet-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}
                >
                  {s/60}m
                </button>
             ))}
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">
            Neuro-synchronization Protocol v1.2
          </p>
        </div>
      </div>
    </div>
  )
}
