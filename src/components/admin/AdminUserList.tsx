import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Search, Trash2, Mail, ShieldAlert, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    subscription_tier: string;
    ads_disabled: boolean;
    created_at: string;
}

export function AdminUserList() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setUsers(data as Profile[]);
            } else if (error) {
                console.error('Error fetching users:', error);
            }
        } catch (err) {
            console.error('An unexpected error occurred:', err);
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
            console.error('Error toggling ads:', error);
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, ads_disabled: !currentStatus } : u));
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('Error updating role:', error);
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                detail: { title: 'Clearance Updated', message: `Identity ${userId.slice(0,8)} level changed.`, type: 'success' } 
            }));
        }
    };

    const updateSubscription = async (userId: string, newTier: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ subscription_tier: newTier })
            .eq('id', userId);

        if (error) {
            console.error('Error updating subscription:', error);
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u));
            window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                detail: { title: 'Quota Modified', message: `Neural tier adjusted for node ${userId.slice(0,8)}.`, type: 'success' } 
            }));
        }
    };

    const purgeUserData = async (userId: string) => {
        const { error } = await supabase.rpc('delete_user_data_admin', { target_user_id: userId });
        
        if (error) {
            console.error('Error purging user data:', error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                detail: { title: 'PROTOCOL FAILURE', message: error.message, type: 'error' } 
            }));
        } else {
            setUsers(users.filter(u => u.id !== userId));
            window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                detail: { title: 'Data Purged', message: 'User data has been scrubbed from public tables.', type: 'success' } 
            }));
        }
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden bg-white/50 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
            <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">Command Center: User Grid</CardTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{users.length} Active Neural Nodes Detected</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchUsers} 
                      disabled={isLoading}
                      className="rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest h-10 px-6 gap-2 hover:bg-slate-50"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Sync Registry
                    </Button>
                    <div className="relative w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search Identity..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-violet-500"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="px-8 h-14 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Identity</TableHead>
                                <TableHead className="h-14 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clearance</TableHead>
                                <TableHead className="h-14 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription</TableHead>
                                <TableHead className="h-14 text-[10px] font-black text-slate-400 uppercase tracking-widest">Genesis Date</TableHead>
                                <TableHead className="px-8 h-14 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocols</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                                            <span className="text-xs font-black uppercase text-violet-600 animate-pulse">Synchronizing Registry...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-medium italic">
                                        No users found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((profile) => (
                                    <TableRow key={profile.id} className="hover:bg-violet-50/30 transition-colors group">
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center font-bold text-violet-600 border border-violet-200 shadow-sm">
                                                    {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-sm truncate max-w-[150px]">{profile.full_name || 'Anonymous User'}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                                        <Mail className="w-2.5 h-2.5" /> {profile.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                         <TableCell>
                                            <Select 
                                                value={profile.role} 
                                                onValueChange={(val) => updateRole(profile.id, val)}
                                            >
                                                <SelectTrigger className="h-8 w-28 text-[9px] font-black uppercase tracking-tighter rounded-lg border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                    <SelectItem value="user" className="text-[10px] font-bold">User</SelectItem>
                                                    <SelectItem value="admin" className="text-[10px] font-bold">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select 
                                                value={profile.subscription_tier} 
                                                onValueChange={(val) => updateSubscription(profile.id, val)}
                                            >
                                                <SelectTrigger className="h-8 w-32 text-[9px] font-black uppercase tracking-tighter rounded-lg border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                    <SelectItem value="free" className="text-[10px] font-bold">Free Tier</SelectItem>
                                                    <SelectItem value="full_access" className="text-[10px] font-bold">Full Access</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-medium text-muted-foreground">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex items-center justify-end gap-6">
                                                 <div className="flex flex-col items-center">
                                                     <span className="text-[8px] font-black text-muted-foreground uppercase mb-1.5 leading-none tracking-widest">Neural Ads Access</span>
                                                     <div className="flex items-center gap-2">
                                                        <span className={`text-[8px] font-black uppercase ${!profile.ads_disabled ? 'text-rose-500' : 'text-slate-300'}`}>Ads ON</span>
                                                        <Switch 
                                                            checked={profile.ads_disabled} 
                                                            onCheckedChange={() => toggleAds(profile.id, profile.ads_disabled)}
                                                            className="data-[state=checked]:bg-emerald-500"
                                                        />
                                                        <span className={`text-[8px] font-black uppercase ${profile.ads_disabled ? 'text-emerald-500' : 'text-slate-300'}`}>Block Ads</span>
                                                     </div>
                                                 </div>
                                                
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-[2rem] border-rose-100 shadow-2xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-xl font-black uppercase tracking-tighter text-rose-600 flex items-center gap-3">
                                                                <ShieldAlert className="w-6 h-6" />
                                                                Irreversible Deletion
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription className="text-sm font-medium text-slate-500">
                                                                This will permanently terminate the identity sequence for <span className="font-bold text-slate-900">{profile.email}</span>. All stored intelligence snapshots and assets will be inaccessible.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="mt-4 gap-3">
                                                            <AlertDialogCancel className="rounded-xl border-slate-100 font-bold">Abort Protocol</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                                                                onClick={() => purgeUserData(profile.id)}
                                                            >
                                                                Confirm Extraction
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
