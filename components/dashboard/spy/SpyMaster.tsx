'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Mic, Monitor, StopCircle, Play, Save, Trash2, Shield, Loader2, Download, Eye, EyeOff, Settings, Key, HardDrive, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface Recording {
   id: string
   type: 'video' | 'audio' | 'screen'
   url: string
   blob: Blob
   timestamp: number
   duration: number
}

export default function SpyMaster() {
   const [isRecording, setIsRecording] = useState(false)
   const [activeType, setActiveType] = useState<'video' | 'audio' | 'screen' | null>(null)
   const [recordings, setRecordings] = useState<Recording[]>([])
   const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
   const [isSilentMode, setIsSilentMode] = useState(true)
   const [timer, setTimer] = useState(0)
   const [activeTab, setActiveTab] = useState('capture')

   // Settings State
   const [stealthPin, setStealthPin] = useState('')
   const [isChangingPin, setIsChangingPin] = useState(false)
   const [selectedCamera, setSelectedCamera] = useState('default')
   const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])

   const mediaRecorderRef = useRef<MediaRecorder | null>(null)
   const chunksRef = useRef<Blob[]>([])
   const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
   const videoPreviewRef = useRef<HTMLVideoElement>(null)

   useEffect(() => {
      // Get available cameras
      navigator.mediaDevices.enumerateDevices().then(devices => {
         setCameras(devices.filter(d => d.kind === 'videoinput'))
      })

      const savedPin = localStorage.getItem('stealth_pin') || '9988'
      setStealthPin(savedPin)
   }, [])

   useEffect(() => {
      if (previewStream && videoPreviewRef.current) {
         videoPreviewRef.current.srcObject = previewStream
      }
   }, [previewStream])

   const startRecording = async (type: 'video' | 'audio' | 'screen') => {
      try {
         let stream: MediaStream

         if (type === 'video') {
            const constraints = {
               video: selectedCamera === 'default' ? true : { deviceId: { exact: selectedCamera } },
               audio: true
            }
            stream = await navigator.mediaDevices.getUserMedia(constraints)
         } else if (type === 'audio') {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
         } else {
            stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
         }

         setPreviewStream(stream)
         setActiveType(type)
         setIsRecording(true)
         setTimer(0)

         const recorder = new MediaRecorder(stream)
         mediaRecorderRef.current = recorder
         chunksRef.current = []

         recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
         }

         recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: type === 'audio' ? 'audio/webm' : 'video/webm' })
            const url = URL.createObjectURL(blob)
            const newRecording: Recording = {
               id: crypto.randomUUID(),
               type,
               url,
               blob,
               timestamp: Date.now(),
               duration: timer
            }
            setRecordings(prev => [newRecording, ...prev])

            stream.getTracks().forEach(track => track.stop())
            setPreviewStream(null)
            setActiveType(null)
            setIsRecording(false)

            toast.success('Intelligence Captured', { description: `${type.toUpperCase()} packet stored in local cluster.` })
         }

         recorder.start()

         timerIntervalRef.current = setInterval(() => {
            setTimer(prev => prev + 1)
         }, 1000)

         if (!isSilentMode) {
            toast.info('Neural Ingestion Active', { description: `Recording ${type} stream...` })
         }
      } catch (err: any) {
         console.error('Spy Master Failure:', err)
         toast.error('Access Denied', { description: 'System permission required for neural capture.' })
      }
   }

   const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
         mediaRecorderRef.current.stop()
         if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      }
   }

   const handleUpdatePin = () => {
      if (stealthPin.length !== 4 || isNaN(Number(stealthPin))) {
         toast.error('Invalid PIN', { description: 'PIN must be a 4-digit number.' })
         return
      }
      localStorage.setItem('stealth_pin', stealthPin)
      toast.success('Stealth PIN Updated', { description: 'New authorization sequence committed to local registry.' })
      setIsChangingPin(false)
   }

   const formatTime = (s: number) => {
      const m = Math.floor(s / 60)
      const rs = s % 60
      return `${String(m).padStart(2, '0')}:${String(rs).padStart(2, '0')}`
   }

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 group overflow-hidden">
                  <Shield className="w-7 h-7 text-rose-500 animate-pulse" />
               </div>
               <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Spy Master</h1>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                     Direct Intelligence Capture Protocol
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
               <button
                  onClick={() => setIsSilentMode(!isSilentMode)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSilentMode ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
               >
                  {isSilentMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {isSilentMode ? 'Silent Mode On' : 'Silent Mode Off'}
               </button>
            </div>
         </div>

         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-8">
               <TabsTrigger value="capture" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Capture Hub</TabsTrigger>
               <TabsTrigger value="library" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Intelligence Library</TabsTrigger>
               <TabsTrigger value="settings" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Stealth Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="capture" className="space-y-8 mt-0">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     {/* Neural Protocols Card */}
                     <div className="p-8 rounded-[3rem] bg-violet-600 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                 <Shield className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-sm font-black uppercase tracking-widest leading-none mb-1">System Operational Protocols</h3>
                                 <p className="text-[9px] font-bold text-violet-200 uppercase tracking-widest leading-none">Intelligence Guard v15.0.7</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex gap-4">
                                 <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                 <p className="text-[10px] font-medium leading-relaxed italic opacity-90">
                                    <span className="font-black text-emerald-400 uppercase mr-1">Privacy Indicator:</span>
                                    OS-level Microphone dots (Orange/Green) are mandatory security triggers and cannot be bypassed.
                                 </p>
                              </div>
                              <div className="flex gap-4">
                                 <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                                 <p className="text-[10px] font-medium leading-relaxed italic opacity-90">
                                    <span className="font-black text-amber-400 uppercase mr-1">Background Access:</span>
                                    Requires PWA or Native installation for persistent stealth capture when the screen is inactive.
                                 </p>
                              </div>
                              <div className="flex gap-4">
                                 <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                                 <p className="text-[10px] font-medium leading-relaxed italic opacity-90">
                                    <span className="font-black text-blue-400 uppercase mr-1">Remote Bridge:</span>
                                    Subscriber-only feature. Synchronize multiple device microphones over encrypted Neural Audio Bridge.
                                 </p>
                              </div>
                           </div>

                           <div className="flex gap-3 pt-2">
                              <Button className="flex-1 h-12 bg-white text-violet-600 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl">
                                 Neural Hub Deployment
                              </Button>
                              <Button className="flex-1 h-12 bg-violet-900/50 text-white border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest">
                                 Full Access Authorization
                              </Button>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4">
                        <button
                           disabled={isRecording && activeType !== 'video'}
                           onClick={() => isRecording ? stopRecording() : startRecording('video')}
                           className={`flex flex-col items-center gap-4 p-8 rounded-[3rem] border-2 transition-all group ${isRecording && activeType === 'video' ? 'bg-rose-50 border-rose-500 text-rose-600 animate-pulse' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500 hover:border-rose-300'}`}
                        >
                           <div className={`p-4 rounded-2xl shadow-xl transition-all ${isRecording && activeType === 'video' ? 'bg-rose-500 text-white rotate-12' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:scale-110'}`}>
                              <Camera className="w-8 h-8" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">
                              {isRecording && activeType === 'video' ? 'Stop Camera' : 'Start Camera'}
                           </span>
                        </button>

                        <button
                           disabled={isRecording && activeType !== 'audio'}
                           onClick={() => isRecording ? stopRecording() : startRecording('audio')}
                           className={`flex flex-col items-center gap-4 p-8 rounded-[3rem] border-2 transition-all group ${isRecording && activeType === 'audio' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 animate-pulse' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500 hover:border-emerald-300'}`}
                        >
                           <div className={`p-4 rounded-2xl shadow-xl transition-all ${isRecording && activeType === 'audio' ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:scale-110'}`}>
                              <Mic className="w-8 h-8" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">
                              {isRecording && activeType === 'audio' ? 'Stop Audio' : 'Start Audio'}
                           </span>
                        </button>

                        <button
                           disabled={isRecording && activeType !== 'screen'}
                           onClick={() => isRecording ? stopRecording() : startRecording('screen')}
                           className={`flex flex-col items-center gap-4 p-8 rounded-[3rem] border-2 transition-all group ${isRecording && activeType === 'screen' ? 'bg-blue-50 border-blue-500 text-blue-600 animate-pulse' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500 hover:border-blue-300'}`}
                        >
                           <div className={`p-4 rounded-2xl shadow-xl transition-all ${isRecording && activeType === 'screen' ? 'bg-blue-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:scale-110'}`}>
                              <Monitor className="w-8 h-8" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">
                              {isRecording && activeType === 'screen' ? 'Stop Screen' : 'Start Screen'}
                           </span>
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-[3rem] bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Video Node</p>
                           <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">Captures high-fidelity neural streams. Impact: 100% visual retention for physical environments.</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Audio Bridge</p>
                           <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">Silent acoustic capture. Impact: Optimized for cross-device remote listening and transcription.</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Screen Matrix</p>
                           <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">Digital surface ingestion. Impact: Records all workspace operations for neural re-play.</p>
                        </div>
                     </div>

                     <AnimatePresence>
                        {isRecording && (
                           <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="relative aspect-video bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-900 group"
                           >
                              {!isSilentMode && (
                                 <div className="absolute top-8 left-8 z-10 flex items-center gap-3 bg-rose-600/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl">
                                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-white">{formatTime(timer)}</span>
                                 </div>
                              )}

                              {activeType !== 'audio' ? (
                                 <video
                                    ref={videoPreviewRef}
                                    autoPlay
                                    muted
                                    className={`w-full h-full object-cover ${isSilentMode ? 'opacity-0' : 'opacity-100'}`}
                                 />
                              ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                       {[1, 2, 3, 4, 5, 6].map(i => (
                                          <motion.div
                                             key={i}
                                             animate={{ height: [10, 40, 10] }}
                                             transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                             className="w-1.5 bg-emerald-500 rounded-full"
                                          />
                                       ))}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic opacity-60">Ingesting Audio Stream...</p>
                                 </div>
                              )}

                              {isSilentMode && (
                                 <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                                    <div className="text-center space-y-4">
                                       <Shield className="w-12 h-12 text-slate-800 mx-auto" />
                                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Neural Screen Shield Active</p>
                                    </div>
                                 </div>
                              )}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>

                  <div className="p-8 rounded-[3rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center text-center space-y-6">
                     <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center shadow-2xl">
                        <ShieldAlert className="w-10 h-10 text-rose-500" />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic">Operational Security</h3>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed italic">
                           All media packets are processed and stored locally within your biological cluster. Cloud synchronization is disabled for this protocol to maintain absolute sovereignty.
                        </p>
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="library" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recordings.length === 0 ? (
                     <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-slate-50/50 dark:bg-transparent">
                        <Save className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Intelligence Captured</p>
                     </div>
                  ) : (
                     recordings.map((rec) => (
                        <Card key={rec.id} className="rounded-[2.5rem] border-slate-100 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900 overflow-hidden group">
                           <CardContent className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className={`p-4 rounded-2xl ${rec.type === 'video' ? 'bg-rose-50 text-rose-500' : rec.type === 'audio' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                    {rec.type === 'video' ? <Camera className="w-5 h-5" /> : rec.type === 'audio' ? <Mic className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black uppercase tracking-tight truncate">Capture {new Date(rec.timestamp).toLocaleTimeString()}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{rec.type} • {formatTime(rec.duration)}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 mt-6">
                                 <Button
                                    className="flex-1 h-10 rounded-xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest shadow-lg"
                                    onClick={() => window.open(rec.url, '_blank')}
                                 >
                                    <Play className="w-3.5 h-3.5 mr-2" /> Replay
                                 </Button>
                                 <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-10 w-10 rounded-xl text-rose-500 border-rose-100 hover:bg-rose-50"
                                    onClick={() => {
                                       setRecordings(prev => prev.filter(r => r.id !== rec.id))
                                       toast.info('Node Purged')
                                    }}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </div>
                           </CardContent>
                        </Card>
                     ))
                  )}
               </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center">
                           <Key className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                           <h4 className="text-sm font-black uppercase tracking-widest">Stealth Authorization</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry PIN Configuration</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New 4-Digit PIN</label>
                           <div className="flex gap-3">
                              <Input
                                 type="password"
                                 maxLength={4}
                                 placeholder="****"
                                 value={stealthPin}
                                 onChange={(e) => setStealthPin(e.target.value)}
                                 className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center font-black tracking-[0.5em]"
                              />
                              <Button
                                 onClick={handleUpdatePin}
                                 className="h-12 px-6 rounded-2xl bg-violet-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-200"
                              >
                                 Update
                              </Button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                           <Camera className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                           <h4 className="text-sm font-black uppercase tracking-widest">Neural Input Source</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hardware Entry Point</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Default Video Node</label>
                           <select
                              value={selectedCamera}
                              onChange={(e) => setSelectedCamera(e.target.value)}
                              className="w-full h-12 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                           >
                              <option value="default">System Default</option>
                              {cameras.map(cam => (
                                 <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}</option>
                              ))}
                           </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                           <div className="flex items-center gap-3">
                              <HardDrive className="w-4 h-4 text-slate-400" />
                              <p className="text-[10px] font-black uppercase tracking-widest">auto delete</p>
                           </div>
                           <Switch />
                        </div>

                        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-4">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <HardDrive className="w-4 h-4 text-blue-500" />
                                 <p className="text-[10px] font-black uppercase tracking-widest">Local Repository</p>
                              </div>
                              <Button
                                 onClick={() => toast.info('System Explorer Invoked')}
                                 variant="outline"
                                 className="h-8 px-3 rounded-xl text-[8px] font-black uppercase tracking-widest"
                              >
                                 Select
                              </Button>
                           </div>
                           <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                              <p className="text-[9px] font-mono text-slate-400 break-all">~/Documents/SmartNotes/Intelligence/</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </TabsContent>
         </Tabs>
      </div>
   )
}
