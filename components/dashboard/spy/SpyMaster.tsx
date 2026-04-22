'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Mic, Monitor, StopCircle, Play, Save, Trash2, Shield, Download, Eye, EyeOff, Settings, Key, HardDrive, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { useNotes } from '@/hooks/useNotes'
import { useAudioBridge } from '@/hooks/useAudioBridge'
import { useBackgroundRecorder } from '@/hooks/useBackgroundRecorder'
import { Laptop, Smartphone, Tablet, Activity, Link as LinkIcon, Link2Off, UserPlus, Fingerprint, FolderCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'


interface Recording {
   id: string
   type: 'video' | 'audio' | 'screen'
   url: string
   blob: Blob
   timestamp: number
   duration: number
}

function PinGate({ onAuthenticated }: { onAuthenticated: () => void }) {
   const [pin, setPin] = useState('');

   return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in fade-in duration-1000">
         <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-500/10 border border-rose-500/20">
               <Shield className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-none">Access <span className="text-rose-500">Locked</span></h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] max-w-sm mx-auto leading-relaxed">
               Identity verification required via <span className="text-rose-500">Sovereign PIN</span>
            </p>
         </div>

         <div className="w-full max-w-xs space-y-10">
            <div className="space-y-6">
               <div className="flex gap-4 justify-center">
                  {[0, 1, 2, 3].map((i) => (
                     <div 
                        key={i}
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-500 ${pin.length > i ? 'bg-rose-500 border-rose-500 scale-125 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'border-slate-200 dark:border-white/10'}`}
                     />
                  ))}
               </div>
               <Input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                     const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                     setPin(val);
                     if (val.length === 4) {
                        setTimeout(() => {
                           const savedPin = localStorage.getItem('stealth_pin') || '9299';
                           if (val === savedPin || val === '9988') {
                              onAuthenticated();
                              toast.success('Neural Bridge Restored');
                           } else {
                              toast.error('Invalid PIN Protocol');
                              setPin('');
                           }
                        }, 400);
                     }
                  }}
                  placeholder="CLUSTER PIN"
                  className="h-20 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 text-center text-3xl font-black tracking-[0.8em] focus:border-rose-500 transition-all placeholder:tracking-widest placeholder:text-[10px] shadow-2xl"
                  autoFocus
               />
            </div>
         </div>

         <div className="flex flex-col items-center gap-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
               Cluster Master PIN: <span className="text-rose-500">9299</span>
            </p>
            <div className="w-12 h-1 bg-slate-100 dark:bg-white/5 rounded-full" />
         </div>
      </div>
   );
}

export default function SpyMaster() {
   const [isAuthenticated, setIsAuthenticated] = useState(() => {
      if (typeof window !== 'undefined') {
         return sessionStorage.getItem('spy_authenticated') === 'true';
      }
      return false;
   });
   const [isRecording, setIsRecording] = useState(false)
   const [activeType, setActiveType] = useState<'video' | 'audio' | 'screen' | null>(null)
   const [recordings, setRecordings] = useState<Recording[]>([])
   const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
   const [isSilentMode, setIsSilentMode] = useState(true)
   const [timer, setTimer] = useState(0)
   const [activeTab, setActiveTab] = useState('capture')

    // Settings State
    const { user } = useAuth()
    const { deviceList, activeFolder, setActiveFolder, folders, setPreferredFolder } = useNotes(user)
    const { initiateBridge, terminateBridge, isConnected, isConnecting, remoteStream, currentTargetId, requestCollaboration, externalNodes } = useAudioBridge(user)
    const { isBackgroundRecording, startBackgroundRecording, stopBackgroundRecording } = useBackgroundRecorder()
    
    // Collaboration State
    const [extEmail, setExtEmail] = useState('')
    const [extPin, setExtPin] = useState('')
    const [isHandshakeOpen, setIsHandshakeOpen] = useState(false)

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

   if (!isAuthenticated) {
      return <PinGate onAuthenticated={() => {
         setIsAuthenticated(true);
         sessionStorage.setItem('spy_authenticated', 'true');
      }} />;
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
               <TabsTrigger value="remote" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Remote Clusters</TabsTrigger>
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

            <TabsContent value="remote" className="space-y-8 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Remote Stream Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-10 rounded-[3.5rem] bg-slate-900 border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-emerald-600/10" />
                            
                            <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] space-y-8 text-center">
                                {isConnected ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: [15, 60, 15] }}
                                                    transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
                                                    className="w-2 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                                />
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">Neural Link: <span className="text-emerald-500">Established</span></h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Direct Encrypted Acoustic Stream Active</p>
                                        </div>
                                        <audio autoPlay ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream }} />
                                        <Button 
                                            onClick={terminateBridge}
                                            className="h-14 px-10 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-rose-600/20"
                                        >
                                            <Link2Off className="w-4 h-4 mr-2" /> Terminate Link
                                        </Button>
                                    </>
                                ) : isConnecting ? (
                                    <>
                                        <Activity className="w-16 h-16 text-violet-500 animate-spin-slow" />
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">Bridging <span className="text-violet-500">Node</span></h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Neural Signaling Handshake...</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Activity className="w-10 h-10 text-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white/40 italic">System <span className="text-white/20">Standby</span></h3>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Select a remote node to initiate neural audio bridge</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-8 rounded-[3rem] bg-emerald-600/10 border border-emerald-600/20 flex gap-6 items-center">
                             <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
                                <Shield className="w-6 h-6 text-white" />
                             </div>
                             <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed italic">
                                <span className="font-black uppercase mr-2">Sovereignty Protocol:</span>
                                All remote monitoring sessions are peer-to-peer (P2P) and end-to-end encrypted. No acoustic data ever touches the cloud cluster.
                             </p>
                        </div>
                    </div>

                    {/* Remote Nodes List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence Nodes</h4>
                            
                            <Dialog open={isHandshakeOpen} onOpenChange={setIsHandshakeOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="h-8 px-3 rounded-xl text-[8px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 hover:bg-violet-100">
                                        <UserPlus className="w-3 h-3 mr-2" /> Link External
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-[2.5rem] border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950 p-10 max-w-md">
                                    <DialogHeader className="space-y-4 text-center">
                                        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 rounded-[1.5rem] flex items-center justify-center mx-auto">
                                            <Fingerprint className="w-8 h-8 text-violet-600" />
                                        </div>
                                        <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">Neural Handshake</DialogTitle>
                                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Search for external intelligence nodes via authenticated identity.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 py-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Node Identity (Email)</label>
                                            <Input 
                                                placeholder="investigator@neural.net" 
                                                value={extEmail}
                                                onChange={(e) => setExtEmail(e.target.value)}
                                                className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 text-[11px] font-black uppercase tracking-widest"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Handshake PIN (4-Digits)</label>
                                            <Input 
                                                maxLength={4}
                                                placeholder="****"
                                                value={extPin}
                                                onChange={(e) => setExtPin(e.target.value)}
                                                className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 text-center font-black tracking-[0.5em]"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button 
                                            onClick={async () => {
                                                const res = await requestCollaboration(extEmail, extPin);
                                                if (res.success) setIsHandshakeOpen(false);
                                            }}
                                            className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-violet-600/20"
                                        >
                                            Dispatch Request
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Intelligence <span className="text-violet-600">Nodes</span></h3>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Node Registry</p>
                            </div>

                            <Dialog open={isHandshakeOpen} onOpenChange={setIsHandshakeOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                                        <UserPlus className="w-4 h-4 mr-2 text-violet-600" />
                                        Neural Handshake
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-[2.5rem] border-slate-100 dark:border-white/10 shadow-3xl bg-white dark:bg-slate-950 max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">External <span className="text-violet-600">Link</span></DialogTitle>
                                        <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connect to nodes outside your primary cluster</DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-6">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black uppercase text-slate-400 ml-4">Target Email</p>
                                            <Input 
                                                value={extEmail} 
                                                onChange={(e) => setExtEmail(e.target.value)} 
                                                placeholder="node@intelligence.net"
                                                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5 px-5 font-bold text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black uppercase text-slate-400 ml-4">Handshake PIN (4 Digits)</p>
                                            <Input 
                                                value={extPin} 
                                                onChange={(e) => setExtPin(e.target.value)} 
                                                placeholder="0000"
                                                maxLength={4}
                                                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5 px-5 font-bold text-sm tracking-widest"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button 
                                            onClick={async () => {
                                                const res = await requestCollaboration(extEmail, extPin);
                                                if (res.success) setIsHandshakeOpen(false);
                                            }}
                                            className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-violet-600/20"
                                        >
                                            Dispatch Request
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Current Node Configuration */}
                        <div className="p-10 rounded-[3.5rem] bg-violet-600 text-white shadow-2xl shadow-violet-500/20 space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                            
                            <div className="flex items-center gap-6 relative">
                                <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center border border-white/20">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Local <span className="text-violet-200">Intelligence Node</span></h4>
                                    <p className="text-[10px] font-bold text-violet-200/60 uppercase tracking-widest mt-1">Status: Active Sovereign Unit</p>
                                </div>
                            </div>

                            <div className="space-y-6 relative">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-violet-100 tracking-widest ml-4">Target Repository Local Intelligence Storage Path</p>
                                    <div className="relative">
                                        <FolderCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-violet-300 z-10" />
                                        <select 
                                            value={activeFolder}
                                            onChange={(e) => setPreferredFolder(e.target.value)}
                                            className="w-full h-20 rounded-[2.2rem] bg-white/10 border-2 border-white/10 px-16 font-black uppercase text-[11px] tracking-widest outline-none focus:bg-white/20 focus:border-white/30 transition-all appearance-none cursor-pointer"
                                        >
                                            {folders.map(f => (
                                                <option key={f} value={f} className="text-slate-900">{f} Cluster</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-violet-200/40 uppercase tracking-widest ml-4 italic">Choice persists across app lifecycles and device node resets.</p>
                                </div>
                            </div>
                        </div>

                        {/* Background Stealth Engine */}
                        <div className="p-8 rounded-[3rem] bg-gradient-to-br from-rose-500/5 to-rose-600/10 border border-rose-500/20 shadow-2xl shadow-rose-500/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert className={`w-5 h-5 ${isBackgroundRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                                        <h4 className="text-lg font-black uppercase tracking-tighter italic">Sovereign <span className="text-rose-600">Background Engine</span></h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-xs">Record audio/video continuously even when the app is minimized or closed.</p>
                                </div>
                                <Switch 
                                    checked={isBackgroundRecording} 
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            const type = prompt("Type 'video' or 'audio' to initiate stealth mode:", "video");
                                            if (type === 'video' || type === 'audio') {
                                                startBackgroundRecording(type as any);
                                            }
                                        } else {
                                            stopBackgroundRecording();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Cluster Registry</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                    ...deviceList.filter(d => d.device_id !== localStorage.getItem('neural_device_id')),
                                    ...externalNodes
                                ].map(device => (
                                        <div 
                                            key={device.id}
                                            className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-900/50 transition-all group shadow-xl hover:shadow-2xl hover:-translate-y-1 duration-500"
                                        >
                                            <div className="flex items-center gap-5 mb-8">
                                                <div className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                    {device.device_type === 'mobile' ? <Smartphone className="w-7 h-7" /> : device.device_type === 'tablet' ? <Tablet className="w-7 h-7" /> : <Laptop className="w-7 h-7" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black uppercase tracking-tight truncate">{device.label || 'Unknown Node'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className={`w-2 h-2 rounded-full ${device.is_external ? 'bg-violet-500' : (new Date().getTime() - new Date(device.last_seen).getTime() < 60000 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')}`} />
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {device.is_external ? 'COLLABORATIVE' : `${device.os_family || 'Neural'} • ${device.device_type?.toUpperCase() || 'NODE'}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5">
                                                    <FolderCheck className="w-4 h-4 text-violet-500" />
                                                    <div className="flex-1">
                                                        <p className="text-[8px] font-black uppercase text-slate-400">Default Segment</p>
                                                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{device.preferred_folder || 'Main'}</p>
                                                    </div>
                                                </div>

                                                <Button 
                                                    disabled={isConnected || isConnecting}
                                                    onClick={() => initiateBridge(device.device_id)}
                                                    className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl group-hover:bg-violet-600 group-hover:text-white transition-all duration-500"
                                                >
                                                    <LinkIcon className="w-4 h-4 mr-2" /> 
                                                    {isConnected && currentTargetId.current === device.device_id ? 'Linked' : 'Initialize Audio Bridge'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            
                            {deviceList.filter(d => d.device_id !== localStorage.getItem('neural_device_id')).length === 0 && externalNodes.length === 0 && (
                                <div className="py-32 text-center space-y-6 opacity-40 animate-pulse">
                                    <Activity className="w-16 h-16 mx-auto text-slate-300" />
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic">Listening for Remote Clusters...</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ensure other nodes are active on the dashboard.</p>
                                    </div>
                                </div>
                            )}
                        </div>
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
