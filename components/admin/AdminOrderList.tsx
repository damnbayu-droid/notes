'use client'

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CreditCard, 
  RefreshCw, 
  Plus, 
  Loader2, 
  Search, 
  User, 
  Mail, 
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Order {
    id: string;
    user_email: string;
    user_name: string | null;
    plan_name: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    created_at: string;
}

export function AdminOrderList() {
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [newOrder, setNewOrder] = useState({
      email: '',
      name: '',
      plan: 'full-intelligence',
      amount: '50000',
      status: 'completed'
    });

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err: any) {
            console.error('Order Registry Sync Failure:', err);
            const errorMessage = err.message || JSON.stringify(err) || 'Unknown Protocol Failure';
            toast.error('Registry Access Denied', { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateManualOrder = async () => {
        if (!newOrder.email) {
            toast.error('Identity identifier required');
            return;
        }
        
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('orders')
                .insert({
                    user_email: newOrder.email,
                    user_name: newOrder.name,
                    plan_name: newOrder.plan,
                    amount: parseFloat(newOrder.amount),
                    method: 'manual',
                    status: newOrder.status,
                    notes: 'Administrative manual override'
                });

            if (error) throw error;
            
            // Also update the user's profile to match the new tier
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ 
                subscription_tier: newOrder.plan,
                ads_disabled: true
              })
              .eq('email', newOrder.email);

            if (profileError) console.warn('Profile sync failed, but order created:', profileError);

            toast.success('Manual Provisioning Sequence Successful');
            setIsManualOrderOpen(false);
            setNewOrder({ email: '', name: '', plan: 'full-intelligence', amount: '50000', status: 'completed' });
            fetchOrders();
        } catch (err: any) {
            toast.error(`Provisioning Failure: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o => 
        o.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.user_name && o.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        o.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                      Order Registry <CreditCard className="w-8 h-8 text-violet-600" />
                    </CardTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        {orders.length} Intelligence Transactions Logged
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Dialog open={isManualOrderOpen} onOpenChange={setIsManualOrderOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                className="h-12 px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all gap-2"
                            >
                                <Plus className="w-4 h-4" /> Manual Provision
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-[3rem] p-10 border-0 bg-white dark:bg-slate-950 shadow-3xl">
                            <DialogHeader className="items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl rotate-6">
                                    <ShieldCheck className="w-8 h-8 text-white dark:text-slate-900" />
                                </div>
                                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">Administrative Provision</DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Zero-Latency Subscription Activation</p>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-4">Recipient Email</Label>
                                    <Input 
                                        placeholder="agent@neural.bridge" 
                                        value={newOrder.email}
                                        onChange={(e) => setNewOrder({...newOrder, email: e.target.value})}
                                        className="h-14 rounded-2xl border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-3">
                                       <Label className="text-[10px] font-black uppercase tracking-widest ml-4">Subscription Plan</Label>
                                       <Select 
                                         value={newOrder.plan} 
                                         onValueChange={(val) => {
                                           setNewOrder({...newOrder, plan: val, amount: val === 'starter-node' ? '15000' : val === 'full-intelligence' ? '50000' : '150000'})
                                         }}
                                       >
                                           <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 font-black uppercase text-[9px] tracking-widest">
                                               <SelectValue />
                                           </SelectTrigger>
                                           <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                               <SelectItem value="starter-node" className="text-[10px] font-black uppercase py-3">Starter Node</SelectItem>
                                               <SelectItem value="full-intelligence" className="text-[10px] font-black uppercase py-3">Full Intel</SelectItem>
                                               <SelectItem value="enterprise-hub" className="text-[10px] font-black uppercase py-3">Enterprise</SelectItem>
                                           </SelectContent>
                                       </Select>
                                   </div>
                                   <div className="space-y-3">
                                      <Label className="text-[10px] font-black uppercase tracking-widest ml-4">Registry Amount</Label>
                                      <Input 
                                          value={newOrder.amount}
                                          onChange={(e) => setNewOrder({...newOrder, amount: e.target.value})}
                                          className="h-14 rounded-2xl border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 font-black uppercase text-xs"
                                      />
                                   </div>
                                </div>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-4 mt-6">
                                <Button variant="ghost" onClick={() => setIsManualOrderOpen(false)} className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">Abort</Button>
                                <Button onClick={handleCreateManualOrder} disabled={isLoading} className="h-14 flex-1 rounded-2xl bg-violet-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Protocol'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      onClick={fetchOrders} 
                      disabled={isLoading}
                      className="rounded-2xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest h-12 px-6 gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search orders..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-[10px] font-bold"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableHead className="px-8 h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Identity</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription Protocol</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</TableHead>
                                <TableHead className="px-8 h-16 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Trail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                       <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Registry Empty: Zero Active Transactions</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 shadow-inner">
                                                    {(order.user_email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-[13px] text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-1">
                                                       {order.user_name || 'Anonymous Segment'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 leading-none">
                                                        <Mail className="w-3 h-3 opacity-50" /> {order.user_email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                           <div className="flex items-center gap-2">
                                              <Badge variant="outline" className="rounded-lg h-7 px-3 text-[9px] font-black uppercase tracking-widest border-slate-200 dark:border-white/5 bg-white shadow-sm">
                                                  {order.plan_name}
                                              </Badge>
                                           </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {order.method === 'manual' ? (
                                                   <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 rounded-full h-6 px-3 text-[8px] font-black uppercase tracking-widest">Manual Override</Badge>
                                                ) : (
                                                   <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 rounded-full h-6 px-3 text-[8px] font-black uppercase tracking-widest">Paypal / Doku</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                            {order.currency} {order.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {order.status === 'completed' ? (
                                                   <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                   <Clock className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                           <div className="flex flex-col items-end">
                                              <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none mb-1">{new Date(order.created_at).toLocaleDateString()}</span>
                                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleTimeString()}</span>
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
