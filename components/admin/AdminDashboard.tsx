'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Activity, 
  Shield, 
  Clock,
  Crown,
  Phone,
  CheckCircle,
  Archive,
  Users,
  MessageSquare,
  FileText,
  Sparkles,
  CreditCard,
  X,
  Menu, 
  ChevronLeft, 
  AlertTriangle, 
  Database,
  Unplug,
  Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminUserList } from './AdminUserList';
import { AdminOrderList } from './AdminOrderList';
import { AiMasterPanel } from './AiMasterPanel';

interface AdminStats {
    totalUsers: number;
    paidUsers: number;
    activeToday: number;
    totalFiles: number;
    totalDiscoveryNotes: number;
    neuralNodes?: number;
}

export function AdminDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, paidUsers: 0, activeToday: 0, totalFiles: 0, totalDiscoveryNotes: 0 });
    const [messages, setMessages] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'orders' | 'logs' | 'ai-master'>('overview');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [diagData, setDiagData] = useState<any>(null);

    const runDiagnostics = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
            const { error: profileError } = await supabase.from('profiles').select('id').limit(1);
            const { error: orderError } = await supabase.from('orders').select('id').limit(1);
            
            setDiagData({
                email: user?.email,
                authRole: user?.app_metadata?.role || 'none',
                dbRole: profile?.role || 'none',
                profilesAccess: profileError ? `Denied: ${profileError.message}` : 'Granted',
                ordersAccess: orderError ? `Denied: ${orderError.message}` : 'Granted',
                status: (profile?.role === 'admin' || user?.email === 'damnbayu@gmail.com') ? 'Admin Clearance Active' : 'Restricted Identity'
            });
        } catch (err: any) {
            setDiagData({ error: err.message });
        }
    };

    const fetchAdminData = async () => {
        try {
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: paidCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('subscription_tier', 'free');
            const { count: fileCount } = await supabase.from('notes').select('*', { count: 'exact', head: true });
            const { count: discoveryCount } = await supabase.from('discovery_notes').select('*', { count: 'exact', head: true });
            
            const { data: profiles } = await supabase.from('profiles').select('interests');
            const neuralCount = (profiles as any[])?.filter((p: any) => p.interests && p.interests.length > 0).length || 0;
            
            setStats({
                totalUsers: userCount || 0,
                paidUsers: paidCount || 0,
                activeToday: Math.floor((userCount || 0) * 0.4) || 0, 
                totalFiles: fileCount || 0,
                totalDiscoveryNotes: discoveryCount || 0,
                neuralNodes: neuralCount
            });

            const { data: supportMsgs } = await supabase
                .from('support_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            
            const { data: payMsgs } = await supabase
                .from('payment_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            const combined = [
                ...(supportMsgs || []).map((m: any) => ({ ...m, type: 'support' })),
                ...(payMsgs || []).map((m: any) => ({ 
                    ...m, 
                    type: 'payment', 
                    subject: `Payment from ${m.user_email}`, 
                    message: `User upgraded to ${m.plan_name} (${m.amount} ${m.currency})`, 
                    status: 'unread' 
                }))
            ].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setMessages(combined);

            const { data: logData } = await supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            setLogs(logData || []);

        } catch (err) {
            console.error('Error fetching admin data:', err);
        }
    }

    useEffect(() => {
        fetchAdminData();
    }, []);

    const updateMessageStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase.from('support_messages').update({ status }).eq('id', id);
            if (!error) {
                setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
                window.dispatchEvent(new CustomEvent('dcpi-notification', {
                    detail: { title: 'Message Updated', type: 'success' }
                }));
            }
        } catch (err) {
            console.error('Error updating message status:', err);
        }
    };

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'ai-master', label: 'Master Intelligence', icon: Sparkles },
        { id: 'orders', label: 'Order Registry', icon: CreditCard },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'logs', label: 'System Logs', icon: Shield },
    ];

    return (
        <div className="flex h-full bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl relative">
            {/* Admin Side Panel */}
            <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-6 transition-all duration-500 relative shrink-0`}>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 active:scale-95 transition-all"
                >
                    {isCollapsed ? <Menu className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                <div className={`flex items-center gap-3 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
                   <div className="p-1.5 bg-violet-600 rounded-lg shadow-lg shadow-violet-500/20 shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                   </div>
                   {!isCollapsed && <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Admin Control</h2>}
                </div>

                <nav className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            title={item.label}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${
                                isCollapsed ? 'justify-center' : ''
                            } ${
                                activeTab === item.id 
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <item.icon className={`w-3.5 h-3.5 shrink-0 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className={`mt-auto px-2 py-4 bg-slate-900 rounded-[1.5rem] text-center border border-white/5 ${isCollapsed ? 'p-1' : ''}`}>
                    {!isCollapsed ? (
                        <>
                            <p className="text-[9px] text-violet-400 font-black uppercase tracking-[0.3em] mb-1 leading-none">Status: Stable</p>
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none">Smart Notes HQ</p>
                        </>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto animate-pulse" />
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 overflow-auto ${isCollapsed ? 'p-4 sm:p-6' : 'p-6 sm:p-10'} custom-scrollbar bg-white dark:bg-slate-950 transition-all`}>
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 rounded-full px-3 font-black text-[8px] uppercase tracking-widest leading-none py-1">Real-time Terminal Active</Badge>
                              </div>
                              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">System Intelligence</h1>
                           </div>

                           <Button 
                               variant="outline" 
                               onClick={runDiagnostics}
                               className="h-10 rounded-xl px-4 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-violet-600 hover:text-white transition-all"
                           >
                              <Fingerprint className="w-3.5 h-3.5" /> Neural Diagnostics
                           </Button>
                        </div>

                        {diagData && (
                           <Card className="p-6 rounded-[2rem] border-violet-100 dark:border-violet-900/30 bg-violet-50/30 dark:bg-violet-950/20 animate-in slide-in-from-top-4 duration-500">
                              <div className="flex items-center justify-between mb-4">
                                 <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-600 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Identity Matrix Scan
                                 </h3>
                                 <button onClick={() => setDiagData(null)} className="text-violet-400 hover:text-violet-600 transition-colors">
                                    <X className="w-3 h-3" />
                                 </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Identity</p>
                                    <p className="text-[10px] font-black text-slate-900 dark:text-white truncate">{diagData.email}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Database Credentials</p>
                                    <p className="text-[10px] font-black text-slate-900 dark:text-white">{diagData.dbRole} Role / {diagData.authRole} Auth</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Clearance Status</p>
                                    <p className={`text-[10px] font-black ${diagData.status.includes('Active') ? 'text-emerald-500' : 'text-rose-500'}`}>{diagData.status}</p>
                                 </div>
                              </div>
                              <div className="mt-6 pt-4 border-t border-violet-100 dark:border-violet-900/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${diagData.profilesAccess === 'Granted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                       <Users className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                       <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Profiles Ledger</p>
                                       <p className="text-[10px] font-black uppercase tracking-tight">{diagData.profilesAccess}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${diagData.ordersAccess === 'Granted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                       <Database className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                       <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Order Registry</p>
                                       <p className="text-[10px] font-black uppercase tracking-tight">{diagData.ordersAccess}</p>
                                    </div>
                                 </div>
                              </div>
                              {diagData.error && (
                                 <div className="mt-4 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-3">
                                    <Unplug className="w-4 h-4 text-rose-500" />
                                    <p className="text-[10px] font-bold text-rose-500">Critical Exception: {diagData.error}</p>
                                 </div>
                              )}
                           </Card>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                                { label: 'Revenue Tier', value: stats.paidUsers, icon: Crown, color: 'text-amber-600', bg: 'bg-amber-600/10' },
                                { label: 'Neural Nodes', value: stats.neuralNodes || 0, icon: Fingerprint, color: 'text-rose-600', bg: 'bg-rose-600/10' },
                                { label: 'Cloud Data', value: stats.totalFiles, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-600/10' },
                            ].map((stat, i) => (
                                <Card key={i} className="p-8 rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all group cursor-default">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`p-4 rounded-3xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div className="h-1.5 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value.toLocaleString()}</p>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
                                </Card>
                            ))}
                        </div>

                        {/* Recent Activity & Messages */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Latest Messages */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Recent Transactions</h3>
                                   <Button 
                                       variant="ghost" 
                                       onClick={() => setActiveTab('messages')}
                                       className="text-[10px] font-black uppercase tracking-widest text-violet-600"
                                   >
                                       View All
                                   </Button>
                                </div>
                                <div className="space-y-4">
                                    {messages.slice(0, 5).map((msg) => (
                                        <div key={msg.id} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5 hover:border-violet-200 transition-all shadow-sm group">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-violet-600 text-lg group-hover:scale-105 transition-transform">
                                                {msg.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                   <h4 className="text-[11px] font-black text-slate-900 dark:text-white truncate">{msg.subject || 'Support Request'}</h4>
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate font-medium">{msg.message}</p>
                                                <Badge variant="outline" className={`rounded-lg h-6 px-2 text-[9px] font-black uppercase tracking-tighter ${msg.status === 'unread' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                    {msg.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && <p className="text-xs font-black text-slate-400 text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] uppercase tracking-widest">Security Matrix Clear</p>}
                                </div>
                            </div>

                            {/* Immutable logs summary */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Audit Trail</h3>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setActiveTab('logs')}
                                        className="text-[10px] font-black uppercase tracking-widest text-violet-600"
                                    >
                                        View All
                                    </Button>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                    <div className="max-h-[380px] overflow-auto custom-scrollbar">
                                        {logs.map((log) => (
                                            <div key={log.id} className="p-5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
                                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                   <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                   <span className="text-xs font-bold text-slate-900 dark:text-white">{log.action}</span>
                                                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                <Badge variant="outline" className="ml-auto text-[8px] font-black tracking-widest uppercase opacity-40">{log.admin_email?.split('@')[0]}</Badge>
                                            </div>
                                        ))}
                                        {logs.length === 0 && <p className="text-xs text-slate-400 text-center py-12 font-black uppercase tracking-widest">Registry Pristine</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <AdminUserList />
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <AdminOrderList />
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col gap-2">
                           <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Support Matrix</h1>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Manage user inquiries and critical feedback</p>
                        </div>
                        <div className="grid gap-6">
                            {messages.map((msg) => (
                                <Card key={msg.id} className="p-8 rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-3xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200 text-xl font-black italic">
                                                {msg.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{msg.email}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 align-middle">
                                                      <Clock className="w-3 h-3" /> {new Date(msg.created_at).toLocaleString()}
                                                   </p>
                                                   {msg.phone && (
                                                      <p className="text-[10px] text-violet-600 font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors hover:text-violet-700 cursor-pointer">
                                                         <Phone className="w-3 h-3" /> {msg.phone}
                                                      </p>
                                                   )}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={`font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-full ${msg.status === 'unread' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{msg.status}</Badge>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl mb-6 ring-1 ring-slate-100 dark:ring-slate-800/50 shadow-inner">
                                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                                           <MessageSquare className="w-3 h-3" /> Subject: {msg.subject || 'Platform Inquiry'}
                                        </h5>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-black italic">"{msg.message}"</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button 
                                           onClick={() => updateMessageStatus(msg.id, 'read')}
                                           className="bg-slate-900 text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest px-8 h-12 shadow-xl"
                                        >
                                           <CheckCircle className="w-4 h-4 mr-2" /> Mark Handled
                                        </Button>
                                        <Button 
                                           variant="outline"
                                           onClick={() => updateMessageStatus(msg.id, 'archived')}
                                           className="rounded-2xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest px-8 h-12 hover:bg-slate-50 dark:hover:bg-slate-900"
                                        >
                                           <Archive className="w-4 h-4 mr-2" /> Archive
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {messages.length === 0 && (
                               <div className="text-center py-24 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/50">
                                  <MessageSquare className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbox Zero Achieved</p>
                               </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'ai-master' && (
                    <AiMasterPanel />
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col gap-2">
                           <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Neural Audit Trail</h1>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Immutable record of all administrative operations</p>
                        </div>
                        <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                                            <TableHead className="px-8 h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</TableHead>
                                            <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</TableHead>
                                            <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operation</TableHead>
                                            <TableHead className="px-8 h-16 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Signature</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="px-8 py-6 text-[10px] font-bold text-slate-500 font-mono">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-[10px] font-black text-white italic">
                                                            {log.admin_email?.[0].toUpperCase() || 'S'}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.admin_email || 'System'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-1">
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-8 py-6 text-right text-[10px] font-bold text-slate-400 font-mono">
                                                    {log.details?.target_id || log.id}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {logs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-64 text-center">
                                                    <Shield className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Pristine</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
