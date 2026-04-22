'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  X, 
  Shield, 
  Zap, 
  Eye, 
  Database, 
  Bell, 
  Smartphone,
  Check,
  ChevronRight,
  Cloud,
  HardDrive,
  FolderOpen,
  PenTool,
  FileImage as ImageIcon,
  Lock,
  Fingerprint
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useNotes } from '@/hooks/useNotes'
import { useAuth } from '@/hooks/useAuth'
import { useBiometrics } from '@/hooks/useBiometrics'

export function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('registry')
  const { user } = useAuth()
  const { diagnostics, forceSync, isOffline, deviceList } = useNotes(user)
  const { authenticate, checkSupport } = useBiometrics()
  const [repoPath, setRepoPath] = useState('~/Documents/SmartNotes/Intelligence_Capture/')
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('biometric_enabled') === 'true'
    setBiometricEnabled(saved)
  }, [])

  const handlePathChange = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        setRepoPath(`File System: ${handle.name}`);
        toast.success('Local Repository Linked', { description: `Path synchronized to "${handle.name}"` });
      } else {
        toast.error('Browser Unsupported', { description: 'Your browser does not support Direct-to-Disk protocols. Please use Chrome or Edge.' });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Path Selection Failed', { description: err.message });
      }
    }
  }

  useEffect(() => {
    const handleOpen = (e: any) => {
      setIsOpen(true)
      if (e.detail?.tab) setActiveTab(e.detail.tab)
    }
    window.addEventListener('open-settings-modal', handleOpen)
    return () => window.removeEventListener('open-settings-modal', handleOpen)
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-100 dark:border-white/5 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5">
                  <Settings className="w-6 h-6 text-violet-600 animate-spin-slow" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-1.5">Registry Settings</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Engine Configuration</p>
               </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="w-full bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8">
                <TabsTrigger value="registry" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                  System
                </TabsTrigger>
                <TabsTrigger value="devices" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                  Dynamic Island
                </TabsTrigger>
                <TabsTrigger value="database" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                  Database
                </TabsTrigger>
                <TabsTrigger value="display" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                  Neural UI
                </TabsTrigger>
                <TabsTrigger value="security" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                  Encryption
                </TabsTrigger>
              </TabsList>

              <TabsContent value="registry" className="space-y-6 mt-0">
                <div className="space-y-4">
                   {/* Permissions Button */}
                   <div className="p-6 rounded-[2rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                      <div className="relative z-10 space-y-4">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                               <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                               <p className="text-xs font-black uppercase tracking-widest">System Integration</p>
                               <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Hardware Permissions Bridge</p>
                            </div>
                         </div>
                         <Button 
                            onClick={async () => {
                               try {
                                  toast.loading('Requesting Neural Access...', { id: 'permissions' });
                                  // Request Camera/Mic
                                  await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                                  // Request Notifications
                                  if ('Notification' in window) await Notification.requestPermission();
                                  toast.success('Permissions Authorized', { id: 'permissions' });
                               } catch (err) {
                                  toast.error('Authorization Failed', { id: 'permissions', description: 'Please enable permissions in browser settings.' });
                               }
                            }}
                            className="w-full h-12 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                         >
                            Authorize All Protocols
                         </Button>
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                            <Zap className="w-5 h-5 text-amber-500" />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Syncing</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Global persistence layer</p>
                         </div>
                      </div>
                      <Switch defaultChecked />
                   </div>

                   <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                            <Bell className="w-5 h-5 text-violet-500" />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Alerts</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Real-time node notifications</p>
                         </div>
                      </div>
                      <Switch defaultChecked />
                   </div>

                   {/* Target Repository moved to Registry Tab */}
                   <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <FolderOpen className="w-5 h-5 text-violet-500" />
                            <div>
                               <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Target Repository</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Local Intelligence Storage Path</p>
                            </div>
                         </div>
                         <Button 
                           onClick={handlePathChange}
                           variant="outline" 
                           className="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800"
                         >
                           Select Location
                         </Button>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                         <p className="text-[10px] font-mono text-slate-400 break-all">{repoPath}</p>
                      </div>
                      <p className="text-[8px] font-bold text-rose-500 uppercase tracking-[0.2em] italic">
                         * Mandatory for Spy Master & PDF Master localized caching.
                      </p>
                   </div>
                </div>
              </TabsContent>

               <TabsContent value="devices" className="space-y-6 mt-0">
                  <div className="space-y-4">
                     <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                              <Smartphone className="w-5 h-5 text-violet-500" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Neural Nodes</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Authorized hardware clusters</p>
                           </div>
                        </div>
                        <div className="px-4 py-1.5 bg-violet-500/10 text-violet-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-violet-500/20">
                           {deviceList.length} Connected
                        </div>
                     </div>

                     <div className="p-6 rounded-[2.5rem] bg-[#0f172a] text-white border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full blur-3xl" />
                        <div className="flex items-center justify-between relative z-10">
                           <div className="flex items-center gap-3">
                              <Database className="w-5 h-5 text-amber-500 animate-pulse" />
                              <h4 className="text-sm font-black uppercase tracking-tighter italic">Storage Trace Telemetry</h4>
                           </div>
                           <Button 
                              variant="ghost" 
                              onClick={forceSync}
                              className="h-8 px-4 rounded-lg bg-white/5 text-white/60 hover:text-white text-[8px] font-black uppercase tracking-widest border border-white/10"
                           >
                              Force Node Sync
                           </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Local Node Count</p>
                              <p className="text-xl font-black text-white tracking-tighter">{diagnostics.notesCount}</p>
                           </div>
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Sync Status</p>
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                 <p className="text-xs font-black text-emerald-400 tracking-tighter uppercase">Verified</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                           <p className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Live Intelligence Stream</p>
                           <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[9px] text-violet-300 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                              <p className="opacity-100">[{new Date().toISOString().split('T')[1].split('.')[0]}] PROTOCOL_SYNC_COMPLETE</p>
                              <p className="opacity-80">[{new Date().toISOString().split('T')[1].split('.')[0]}] NODE_REGISTRY_VERIFIED</p>
                              <p className="opacity-60">[{new Date().toISOString().split('T')[1].split('.')[0]}] STORAGE_CLUSTER_LOAD: {diagnostics.notesCount} ITEMS</p>
                              <p className="opacity-40">[{new Date().toISOString().split('T')[1].split('.')[0]}] NEURAL_BRIDGE_ACTIVE</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        {deviceList.length === 0 ? (
                           <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Nodes Detected</p>
                           </div>
                        ) : (
                            deviceList.map((device: any) => (
                              <div key={device.device_id} className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex flex-col gap-6 group hover:border-violet-300 transition-all shadow-xl">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center relative shadow-inner">
                                          {device.label.includes('MacBook') ? <HardDrive className="w-7 h-7 text-slate-400" /> : <Smartphone className="w-7 h-7 text-slate-400" />}
                                          {device.device_id === localStorage.getItem('neural_device_id') && (
                                             <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                                          )}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                             {device.label || 'Generic Device'}
                                             {device.device_id === localStorage.getItem('neural_device_id') && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded uppercase">Current Node</span>}
                                          </p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                                             Last Active: {new Date(device.last_seen).toLocaleString()}
                                          </p>
                                       </div>
                                    </div>
                                    <Button 
                                       variant="ghost" 
                                       size="icon"
                                       className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                       onClick={() => toast.info('Node Revocation Protocol', { description: 'Contact system administrator for device purge.' })}
                                    >
                                       <X className="w-4 h-4 text-slate-300" />
                                    </Button>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Intelligence Load</p>
                                       <div className="flex items-center gap-2">
                                          <Database className="w-3.5 h-3.5 text-violet-500" />
                                          <span className="text-xs font-black text-slate-900 dark:text-white">{device.notes_count || 0} Nodes</span>
                                       </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Browser Engine</p>
                                       <p className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase italic">{device.browser_engine || 'Unknown Agent'}</p>
                                    </div>
                                 </div>

                                 <div className="p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Local Database Cluster</p>
                                    <p className="text-[9px] font-mono text-violet-400 truncate tracking-tight">{device.storage_key || `notes_${device.user_id.slice(0,8)}_fallback`}</p>
                                 </div>
                              </div>
                            ))
                        )}
                     </div>
                  </div>
               </TabsContent>

              <TabsContent value="database" className="space-y-6 mt-0">
                  <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                              <HardDrive className="w-6 h-6 text-emerald-500" />
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Online Database Core</h4>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Global Persistence Protocols</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-violet-300 transition-all">
                           <div className="flex items-center gap-3">
                              <Cloud className="w-4 h-4 text-blue-500" />
                              <div>
                                 <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Online Reconciliation</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Automatic background sync</p>
                              </div>
                           </div>
                           <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-violet-300 transition-all">
                           <div className="flex items-center gap-3">
                              <Shield className="w-4 h-4 text-emerald-500" />
                              <div>
                                 <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Integrity Guard</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Verify checksums on load</p>
                              </div>
                           </div>
                           <Switch defaultChecked />
                        </div>
                     </div>

                     <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                        <Button 
                           variant="outline" 
                           onClick={() => {
                              toast.loading('Purging neural cache...');
                              setTimeout(() => {
                                 localStorage.clear();
                                 window.location.reload();
                              }, 1500);
                           }}
                           className="w-full h-12 rounded-2xl border-rose-100 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-black uppercase text-[9px] tracking-widest"
                        >
                           Purge Local Intelligence (Factory Reset)
                        </Button>
                     </div>
                  </div>
              </TabsContent>

               <TabsContent value="display" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <button className="flex flex-col items-start gap-4 p-6 rounded-3xl border-2 border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 text-left transition-all">
                      <div className="flex items-center justify-between w-full">
                         <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Eye className="w-5 h-5 text-white" />
                         </div>
                         <Check className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Standard Density</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Balanced neural flow</p>
                      </div>
                   </button>

                   <button className="flex flex-col items-start gap-4 p-6 rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 text-left hover:border-violet-200 transition-all">
                      <div className="flex items-center justify-between w-full">
                         <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                            <Zap className="w-5 h-5 text-slate-400" />
                         </div>
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Compressed Grid</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Maximum data ingestion</p>
                      </div>
                   </button>
                </div>

                <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Workspace Controls</p>
                   <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <PenTool className="w-4 h-4 text-blue-500" />
                         </div>
                         <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Neural Text Editor</p>
                      </div>
                      <Switch 
                        defaultChecked={typeof window !== 'undefined' && localStorage.getItem('editor-text-enabled') !== 'false'} 
                        onCheckedChange={(val) => localStorage.setItem('editor-text-enabled', val.toString())}
                      />
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-emerald-500" />
                         </div>
                         <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Neural Image Editor</p>
                      </div>
                      <Switch 
                        defaultChecked={typeof window !== 'undefined' && localStorage.getItem('editor-image-enabled') !== 'false'} 
                        onCheckedChange={(val) => localStorage.setItem('editor-image-enabled', val.toString())}
                      />
                   </div>
                </div>
              </TabsContent>

               <TabsContent value="security" className="space-y-6 mt-0">
                  <div className="p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5">
                           <Shield className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Security & Identity</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Access Protocols</p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex flex-col items-center text-center space-y-4">
                           <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                              <Lock className="w-7 h-7 text-rose-500" />
                           </div>
                           <div className="space-y-2">
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">System Lock Sequence</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest max-w-[220px]">Immediately lock the neural cluster. Requires FaceID or Fingerprint to unlock.</p>
                           </div>
                           <Button 
                              onClick={() => {
                                 toast.info('Neural Lock Engaged', { description: 'Synchronizing with device-level biometrics...' });
                                 // Dispatch global lock event
                                 window.dispatchEvent(new CustomEvent('neural-lock-system'));
                                 setIsOpen(false);
                              }}
                              className="w-full h-12 rounded-2xl bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/20"
                           >
                              Lock Neural Node
                           </Button>
                        </div>

                        <div className="flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                 <Fingerprint className="w-5 h-5 text-emerald-500" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Biometric Gateway</p>
                                 <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Use FaceID / Fingerprint</p>
                              </div>
                           </div>
                           <Switch 
                              checked={biometricEnabled}
                              onCheckedChange={async (val) => {
                                 if (val) {
                                    try {
                                       const supported = await checkSupport();
                                       if (!supported) throw new Error('Biometrics not supported on this device');
                                       
                                       toast.loading('Initializing Biometric Handshake...', { id: 'bio-init' });
                                       const success = await authenticate();
                                       if (success) {
                                          setBiometricEnabled(true);
                                          localStorage.setItem('biometric_enabled', 'true');
                                          toast.success('Biometric Gateway Activated', { id: 'bio-init' });
                                       }
                                    } catch (err: any) {
                                       toast.error('Activation Failed', { id: 'bio-init', description: err.message });
                                    }
                                 } else {
                                    setBiometricEnabled(false);
                                    localStorage.setItem('biometric_enabled', 'false');
                                    toast.info('Biometric Gateway Deactivated');
                                 }
                              }}
                           />
                        </div>
                     </div>

                     <div className="p-5 rounded-3xl bg-violet-500/5 border border-violet-500/10 flex flex-col space-y-4">
                        <div className="flex items-center gap-4">
                           <Shield className="w-5 h-5 text-violet-500 shrink-0" />
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                              Hardware keys and biometric handshakes are processed via the Neural Security Bus. Your master key remains in the local cluster.
                           </p>
                        </div>
                        <Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest px-6 border-violet-200 text-violet-600">
                           Regenerate Master Key
                        </Button>
                     </div>
                  </div>
               </TabsContent>

               <TabsContent value="offline" className="space-y-6 mt-0">
                  <div className="p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5">
                           <HardDrive className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Local Intelligence Cluster</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Device Storage Protocols</p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                           <div className="flex-1">
                              <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Direct-to-Disk Capture</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Bypass online storage for large media packets</p>
                           </div>
                           <Switch defaultChecked />
                        </div>

                         <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                            <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                               Local storage is verified and secured via hardware-level encryption. All data is routed through the selected Target Repository in the Registry tab.
                            </p>
                         </div>
                     </div>

                     <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/20">
                           <span className="font-bold">Protocol Alert:</span> Media packets from PDF Master and Spy Master are restricted to device storage by default to preserve online storage allocation.
                     </div>
                  </div>
               </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">System Verified v12.1.7</span>
             </div>
             <Button 
               onClick={() => {
                 toast.success('Configuration Synchronized');
                 setIsOpen(false);
               }}
               className="h-12 px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
             >
                Commit Changes
             </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
