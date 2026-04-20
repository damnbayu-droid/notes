'use client'

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Trash2, Mail, ShieldAlert, Database, RefreshCw, Plus, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    subscription_tier: string;
    ads_disabled: boolean;
    created_at: string;
    interests?: string[];
    is_banned?: boolean;
}

export function AdminUserList() {
    const supabase = createClient();
    const [users, setUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [enrollEmail, setEnrollEmail] = useState('');
    const [enrollTier, setEnrollTier] = useState('full_access');
    const [searchTerm, setSearchTerm] = useState('');

    const handleManualEnroll = async () => {
        if (!enrollEmail) {
            toast.error('Identity identifier required');
            return;
        }
        
        setIsLoading(true);
        try {
            // Check if user exists first
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', enrollEmail)
                .single();

            if (existing) {
                // Update existing
                const { error } = await supabase
                    .from('profiles')
                    .update({ subscription_tier: enrollTier, ads_disabled: enrollTier !== 'free' })
                    .eq('id', existing.id);
                
                if (error) throw error;
                toast.success('Existing node upgraded via Manual Override');
            } else {
                // Upsert with temporary ID (system will sync on first login)
                // Note: In production we'd use a service role to create Auth user, 
                // but here we establish the profile first.
                const tempId = crypto.randomUUID();
                const { error } = await supabase
                    .from('profiles')
                    .insert({ 
                        id: tempId,
                        email: enrollEmail, 
                        subscription_tier: enrollTier, 
                        ads_disabled: enrollTier !== 'free',
                        role: 'user'
                    });
                
                if (error) throw error;
                toast.success('New node pre-registered in the Neural Registry');
            }
            setIsEnrollDialogOpen(false);
            setEnrollEmail('');
            fetchUsers();
        } catch (err: any) {
            toast.error(`Override Failure: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // Priority 1: Fetch from primary profiles registry
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Registry Sync Failure:', error);
                
                // Specific RLS Diagnostic
                if (error.code === '42501' || error.message.includes('permission denied')) {
                   toast.error('Permission Matrix Conflict', {
                     description: 'Your current identity lacks the necessary clearance to audit all registry nodes. Verify RLS policies.'
                   });
                } else {
                   toast.error('System Failure', { description: error.message });
                }
            } else {
                setUsers(data as Profile[] || []);
                if (!data || data.length === 0) {
                   toast.info('Registry Synchronized', { description: 'Zero active nodes detected in the current cloud cluster.' });
                } else {
                   toast.success('Registry Synced', { description: `Accessed ${data.length} intelligence nodes.` });
                }
            }
        } catch (err) {
            console.error('Critical Registry Error:', err);
            toast.error('Neural Link Timeout', { description: 'The registry cluster did not respond within the protocol window.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleAds = async (userId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ ads_disabled: !currentStatus })
            .eq('id', userId);

        if (error) {
            toast.error('Failed to patch ad protocol');
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, ads_disabled: !currentStatus } : u));
            toast.success('Ad protocol modified');
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            toast.error('Failed to escalate clearance');
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`Identity cleared as ${newRole}`);
        }
    };

    const updateSubscription = async (userId: string, newTier: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ subscription_tier: newTier })
            .eq('id', userId);

        if (error) {
            toast.error('Failed to primary tier sync');
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u));
            toast.success(`Neural tier adjusted to ${newTier}`);
        }
    };

    const toggleBan = async (userId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: !currentStatus })
            .eq('id', userId);

        if (error) {
            toast.error('Failed to toggle ban status');
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
            toast.success(`User ${!currentStatus ? 'banned' : 'unbanned'} successfully`);
        }
    };

    const purgeUserData = async (userId: string) => {
        const { error } = await supabase.rpc('delete_user_data_admin', { target_user_id: userId });
        
        if (error) {
            console.error('Error purging user data:', error);
            toast.error(`PROTOCOL FAILURE: ${error.message}`);
        } else {
            setUsers(users.filter(u => u.id !== userId));
            toast.success('User data scrubbed from registry');
        }
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Command Center: User Grid</CardTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {users.length} Active Neural Nodes Registered
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                className="h-12 px-8 rounded-2xl bg-violet-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all gap-2"
                            >
                                <Plus className="w-4 h-4" /> Manual Enrollment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-[3rem] p-10 border-0 bg-white dark:bg-slate-950 shadow-3xl">
                            <DialogHeader className="items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-violet-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-violet-500/40 rotate-6">
                                    <Mail className="w-8 h-8 text-white" />
                                </div>
                                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">Manual Override</DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bypassing Doku: Direct Neural Provisioning</p>
                                {/* Protocol BUFF: Data Integrity Heartbeat */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Sync: Online</p>
                                </div>
                            </DialogHeader>
                            <div className="space-y-8 py-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-4">Registry Email</Label>
                                    <Input 
                                        placeholder="user@neural.bridge" 
                                        value={enrollEmail}
                                        onChange={(e) => setEnrollEmail(e.target.value)}
                                        className="h-16 rounded-[1.5rem] border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-bold px-6"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-4">Subscription Protocol</Label>
                                    <Select value={enrollTier} onValueChange={setEnrollTier}>
                                        <SelectTrigger className="h-16 rounded-[1.5rem] border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 font-black uppercase text-[10px] tracking-widest px-6">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                            <SelectItem value="free" className="text-[10px] font-black uppercase tracking-widest py-3">Free Cluster</SelectItem>
                                            <SelectItem value="starter-node" className="text-[10px] font-black uppercase tracking-widest py-3 text-blue-600">Starter Node (15k)</SelectItem>
                                            <SelectItem value="full-intelligence" className="text-[10px] font-black uppercase tracking-widest py-3 text-violet-600">Full Intelligence (50k)</SelectItem>
                                            <SelectItem value="enterprise-hub" className="text-[10px] font-black uppercase tracking-widest py-3 text-amber-600">Enterprise Hub (150k)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-4 mt-4">
                                <Button variant="ghost" onClick={() => setIsEnrollDialogOpen(false)} className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">Abort</Button>
                                <Button onClick={handleManualEnroll} disabled={isLoading} className="h-14 flex-1 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest shadow-2xl">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute Sequence'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      onClick={fetchUsers} 
                      disabled={isLoading}
                      className="rounded-2xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest h-12 px-6 gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm active:scale-95 transition-all"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Sync Registry
                    </Button>
                    <div className="relative w-full md:w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                        <Input 
                            placeholder="Filter Identifiers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 rounded-[1.5rem] border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 focus:ring-violet-500/20 text-[10px] font-bold"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50">
                                <TableHead className="px-8 h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Identity</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Email</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription Protocol</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Role</TableHead>
                                <TableHead className="px-8 h-16 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase text-violet-600 tracking-[0.3em] animate-pulse">Synchronizing Registry...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                       <div className="flex flex-col items-center justify-center gap-6 py-12">
                                          <div className="relative">
                                             <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full animate-pulse" />
                                             <div className="relative w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                <Database className="w-10 h-10 text-slate-300" />
                                             </div>
                                          </div>
                                          <div className="space-y-2">
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Registry Access Restricted</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs mx-auto">
                                                Unable to synchronize with client nodes. Ensure RLS stabilization patch is applied to your project database.
                                            </p>
                                          </div>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="rounded-xl border-violet-200 text-violet-600 text-[9px] font-black uppercase tracking-widest"
                                            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                                          >
                                            Check Cloud Status
                                          </Button>
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((profile) => (
                                    <TableRow key={profile.id} className="hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors group">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group/avatar">
                                                    {profile.avatar_url ? (
                                                        <img 
                                                            src={profile.avatar_url} 
                                                            alt={profile.full_name || 'Node'} 
                                                            className="w-12 h-12 rounded-[1.25rem] object-cover border-2 border-slate-100 dark:border-slate-800 shadow-xl group-hover/avatar:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 flex items-center justify-center font-black text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 shadow-sm group-hover/avatar:scale-105 transition-transform">
                                                            {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {profile.role === 'admin' && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg" title="Admin Clearance">
                                                            <ShieldAlert className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-black text-[10px] text-slate-900 dark:text-white truncate max-w-[220px] uppercase tracking-tighter leading-tight italic">
                                                       {profile.full_name || 'Anonymous Node'}
                                                    </span>
                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 leading-none opacity-50">
                                                            <Mail className="w-2.5 h-2.5 shrink-0" /> {profile.email}
                                                        </span>
                                                        {profile.interests && profile.interests.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {profile.interests.slice(0, 3).map(interest => (
                                                                    <span key={interest} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[7px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                                                        {interest}
                                                                    </span>
                                                                ))}
                                                                {profile.interests.length > 3 && <span className="text-[7px] font-black text-slate-400">+{profile.interests.length - 3}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                         <TableCell>
                                            <Select 
                                                value={profile.role} 
                                                onValueChange={(val) => updateRole(profile.id, val)}
                                            >
                                                <SelectTrigger className="h-10 w-32 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl">
                                                    <SelectItem value="user" className="text-[10px] font-black uppercase tracking-widest py-3">User Node</SelectItem>
                                                    <SelectItem value="admin" className="text-[10px] font-black uppercase tracking-widest py-3 text-violet-600">Admin Priv</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select 
                                                value={profile.subscription_tier} 
                                                onValueChange={(val) => updateSubscription(profile.id, val)}
                                            >
                                                <SelectTrigger className="h-10 w-40 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl">
                                                    <SelectItem value="free" className="text-[10px] font-black uppercase tracking-widest py-3">Free Sequence</SelectItem>
                                                    <SelectItem value="full_access" className="text-[10px] font-black uppercase tracking-widest py-3 text-emerald-600">Full Access</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex items-center justify-end gap-10">
                                                  <div className="flex flex-col items-center">
                                                      <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase mb-2 leading-none tracking-[0.2em]">Banned</span>
                                                      <Switch 
                                                          checked={profile.is_banned || false} 
                                                          onCheckedChange={() => toggleBan(profile.id, profile.is_banned || false)}
                                                          className="data-[state=checked]:bg-rose-600"
                                                      />
                                                  </div>

                                                  <div className="flex flex-col items-center">
                                                      <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase mb-2 leading-none tracking-[0.2em]">Ad Protocols</span>
                                                      <div className="flex items-center gap-3">
                                                         <span className={`text-[8px] font-black uppercase tracking-widest ${!(profile.ads_disabled || false) ? 'text-rose-500' : 'text-slate-200 dark:text-slate-800'}`}>ON</span>
                                                         <Switch 
                                                             checked={profile.ads_disabled || false} 
                                                             onCheckedChange={() => toggleAds(profile.id, profile.ads_disabled || false)}
                                                             className="data-[state=checked]:bg-emerald-500"
                                                         />
                                                         <span className={`text-[8px] font-black uppercase tracking-widest ${(profile.ads_disabled || false) ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-800'}`}>OFF</span>
                                                      </div>
                                                  </div>
                                                
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition-all active:scale-95">
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-[2.5rem] border-rose-100 dark:border-rose-900 shadow-2xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-rose-600 flex items-center gap-3 italic">
                                                                <ShieldAlert className="w-7 h-7" />
                                                                Extraction Protocol
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                                This will permanently terminate the identity sequence for <span className="font-black text-slate-900 dark:text-white underline">{profile.email}</span>. All stored intelligence snapshots and assets will be inaccessible.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="mt-8 gap-4">
                                                            <AlertDialogCancel className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest px-8">Abort Sequence</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                className="h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-rose-500/20"
                                                                onClick={() => purgeUserData(profile.id)}
                                                            >
                                                                Scrub Registry
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
