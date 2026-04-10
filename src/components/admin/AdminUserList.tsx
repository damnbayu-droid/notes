import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Mail, Shield, ShieldAlert, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
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

    const deleteUser = async (userId: string) => {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (error) {
            // If admin delete fails (which it might if not run from a service role)
            // we at least remove them from our profiles list or handle accordingly
            console.error('Error deleting user:', error);
            window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                detail: { title: 'DANGER', message: 'Auth deletion requires Service Role. Please use Supabase Dashboard.', type: 'error' } 
            }));
        } else {
            setUsers(users.filter(u => u.id !== userId));
            window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                detail: { title: 'User Purged', message: 'Credential sequence terminated.', type: 'success' } 
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
                <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search Identity..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-violet-500"
                    />
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
                                            <Badge variant="outline" className={`rounded-lg h-6 px-2 text-[9px] font-black uppercase tracking-tighter ${profile.role === 'admin' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                {profile.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                                                {profile.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`rounded-lg h-6 px-2 text-[9px] font-black uppercase tracking-tighter ${profile.subscription_tier === 'full_access' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500'}`}>
                                                {profile.subscription_tier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-medium text-muted-foreground">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex items-center justify-end gap-6">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] font-black text-muted-foreground uppercase mb-1.5 leading-none tracking-widest">Protocol: Ads</span>
                                                    <Switch 
                                                        checked={profile.ads_disabled} 
                                                        onCheckedChange={() => toggleAds(profile.id, profile.ads_disabled)}
                                                        className="data-[state=checked]:bg-emerald-500"
                                                    />
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
                                                                onClick={() => deleteUser(profile.id)}
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
