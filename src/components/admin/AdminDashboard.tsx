import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Activity, 
  Shield, 
  Search, 
  Clock,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AdminStats {
    totalUsers: number;
    paidUsers: number;
    activeToday: number;
    totalFiles: number;
}

export function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, paidUsers: 0, activeToday: 0, totalFiles: 0 });
    const [messages, setMessages] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'logs'>('overview');

    useEffect(() => {
        async function fetchAdminData() {
            try {
                // Fetch Stats
                const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                const { count: paidCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('subscription_tier', 'free');
                const { count: fileCount } = await supabase.from('notes').select('*', { count: 'exact', head: true });
                
                setStats({
                    totalUsers: userCount || 0,
                    paidUsers: paidCount || 0,
                    activeToday: Math.floor((userCount || 0) * 0.4), // Mocked for now
                    totalFiles: fileCount || 0
                });

                // Fetch Messages
                const { data: msgData } = await supabase
                    .from('support_messages')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);
                setMessages(msgData || []);

                // Fetch Logs
                const { data: logData } = await supabase
                    .from('admin_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);
                setLogs(logData || []);

            } catch (err) {
                console.error('Error fetching admin data:', err);
            } finally {
            }
        }

        fetchAdminData();
    }, []);

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'logs', label: 'System Logs', icon: Shield },
    ];

    return (
        <div className="flex h-full bg-gray-50/50 dark:bg-black/20 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-900 shadow-2xl">
            {/* Admin Side Panel */}
            <div className="w-64 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-r border-gray-100 dark:border-gray-900 p-6 flex flex-col gap-8">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 mb-6">Admin Control</h2>
                    <nav className="space-y-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === item.id 
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-900">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">v2.5.0 ADMIN STABLE</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Platform Overview</h1>
                            <Button variant="outline" size="sm" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Export Data</Button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                                { label: 'Paid Users', value: stats.paidUsers, icon: Crown, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                                { label: 'Active Today', value: stats.activeToday, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                                { label: 'Files Collected', value: stats.totalFiles, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                            ].map((stat, i) => (
                                <Card key={i} className="p-6 rounded-[1.5rem] border-0 bg-white dark:bg-gray-900 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</span>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{stat.value.toLocaleString()}</p>
                                </Card>
                            ))}
                        </div>

                        {/* Recent Activity & Messages */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Latest Messages */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Latest Support Messages</h3>
                                <div className="space-y-3">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 hover:border-violet-200 transition-all cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-bold text-violet-600">
                                                {msg.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{msg.subject}</h4>
                                                <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-violet-50 text-violet-600 text-[9px] font-black uppercase tracking-widest">{msg.status}</Badge>
                                        </div>
                                    ))}
                                    {messages.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No messages yet.</p>}
                                </div>
                            </div>

                            {/* Immutable logs summary */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Security Audit Trail</h3>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                    {logs.map((log) => (
                                        <div key={log.id} className="p-4 border-b border-gray-50 dark:border-gray-800 last:border-0 flex items-center gap-3">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{log.action}</span>
                                            <span className="text-[10px] text-gray-400 ml-auto">{log.admin_email}</span>
                                        </div>
                                    ))}
                                    {logs.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No audit logs available.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">User Management</h1>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input placeholder="Filter by email..." className="pl-10 h-10 rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm" />
                            </div>
                        </div>

                        {/* Simplified Table Header */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="grid grid-cols-5 p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">User</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Role</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subscription</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Created At</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</div>
                            </div>
                            
                            <div className="p-8 text-center text-gray-400 text-xs font-medium">
                                <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                Select a view to manage production users.
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Support Inbox</h1>
                        <div className="grid gap-4">
                            {messages.map((msg) => (
                                <Card key={msg.id} className="p-6 rounded-3xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-violet-600/10 flex items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-violet-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-gray-100">{msg.email}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(msg.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-violet-600 text-white font-black uppercase tracking-widest text-[9px]">{msg.status}</Badge>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl mb-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Subject: {msg.subject}</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{msg.message}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" className="bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-9">Reply</Button>
                                        <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-9">Archive</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
