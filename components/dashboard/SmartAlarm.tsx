'use client'

import { useState, useEffect, useRef } from 'react'
import { AlarmClock, X, Plus, Bell, Trash2, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Alarm {
  id: string
  time: string
  label: string
  isActive: boolean
}

export function SmartAlarm() {
  const [isOpen, setIsOpen] = useState(false)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [mounted, setMounted] = useState(false)

  // Sustainable Foundation: Progressive Side-Effect Hydration (v12.1.2)
  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('smart_alarms') : null
    if (saved) {
      try {
        setAlarms(JSON.parse(saved))
      } catch (err) {
        console.warn('Temporal buffer corruption detected.')
      }
    }
  }, [])
  const [newTime, setNewTime] = useState('08:00')
  const [newLabel, setNewLabel] = useState('')

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('open-alarm-modal', handleOpen)
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      window.removeEventListener('open-alarm-modal', handleOpen)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    localStorage.setItem('smart_alarms', JSON.stringify(alarms))
  }, [alarms])

  // Alarm Check Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTime && now.getSeconds() === 0) {
          window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: {
              title: 'Neural Alarm Triggered',
              message: `Initiate Phase: ${alarm.label || 'Scheduled Intelligence Sync'}.`,
              type: 'warning'
            }
          }))
          toast.warning(`Alarm: ${alarm.label || 'Intelligence Sync'}`, { duration: 10000 })
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [alarms])

  const addAlarm = () => {
    const alarm: Alarm = {
      id: crypto.randomUUID(),
      time: newTime,
      label: newLabel || 'Standard Proc',
      isActive: true
    }
    setAlarms(prev => [...prev, alarm].sort((a, b) => a.time.localeCompare(b.time)))
    setNewLabel('')
    toast.success('Alarm Synchronized')
  }

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id))
  }

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        ref={cardRef}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 z-50 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ml-auto flex items-center justify-center cursor-pointer"
          aria-label="Close Alarm"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center space-y-10 relative z-10 flex-1 overflow-hidden">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <AlarmClock className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Schedule <span className="text-emerald-600">Alarms</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Temporal Matrix Synchronization</p>
          </div>

          {/* New Alarm Form */}
          <div className="w-full flex gap-3 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
             <Input 
                type="time" 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                className="h-14 bg-white dark:bg-slate-900 border-0 rounded-2xl font-black italic text-xl tabular-nums shadow-inner"
             />
             <Input 
                placeholder="Protocol Label..." 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-14 bg-white dark:bg-slate-900 border-0 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-inner flex-1"
             />
             <Button 
                onClick={addAlarm}
                className="h-14 w-14 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex-shrink-0"
             >
                <Plus className="w-6 h-6" />
             </Button>
          </div>

          {/* Alarms List */}
          <div className="w-full flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar">
             {alarms.length === 0 ? (
                <div className="py-12 flex flex-col items-center opacity-30 text-slate-400 space-y-4">
                   <Zap className="w-12 h-12" />
                   <span className="text-[10px] font-black uppercase tracking-widest">No Active Temporals</span>
                </div>
             ) : (
                alarms.map(alarm => (
                   <div 
                      key={alarm.id}
                      className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${alarm.isActive ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-lg' : 'bg-slate-50 dark:bg-slate-950/50 border-transparent opacity-50 grayscale'}`}
                   >
                      <div className="flex flex-col items-start gap-1">
                         <span className="text-3xl font-black italic text-slate-900 dark:text-white tabular-nums">{alarm.time}</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alarm.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAlarm(alarm.id)}
                            className={`h-12 w-12 rounded-xl transition-all ${alarm.isActive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 hover:text-slate-900'}`}
                         >
                            <Bell className="w-5 h-5" />
                         </Button>
                         <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlarm(alarm.id)}
                            className="h-12 w-12 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                         >
                            <Trash2 className="w-5 h-5" />
                         </Button>
                      </div>
                   </div>
                ))
             )}
          </div>

          <div className="flex items-center gap-2">
             <Globe className="w-4 h-4 text-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">Local Synchronized Matrix Time</span>
          </div>
        </div>
      </div>
    </div>
  )
}
