import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Mail, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function ContactModal({ isOpen, onClose, userEmail = '' }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('support_messages').insert([{
        name,
        email,
        phone,
        subject: subject || 'General Inquiry',
        message,
        status: 'unread',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        // Clear form
        setPhone('');
        setSubject('');
        setMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Contact submit error:', err);
      window.dispatchEvent(new CustomEvent('dcpi-notification', {
        detail: { title: 'Submit Failed', message: err.message, type: 'error' }
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-violet-100 shadow-2xl">
        {isSuccess ? (
          <div className="p-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Message Sent</h2>
            <p className="text-slate-500 font-medium">Our team will review your inquiry and get back to you shortly. Thank you!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-8 bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <DialogHeader className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Contact Us</DialogTitle>
                  <DialogDescription className="text-violet-100 font-medium opacity-90">
                    Have a question or feedback? We'd love to hear from you.
                  </DialogDescription>
                </DialogHeader>
            </div>

            <div className="p-8 space-y-5 bg-white">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <div className="relative">
                  <Input 
                    placeholder="Enter your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 rounded-2xl border-slate-100 focus:ring-violet-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 rounded-2xl border-slate-100 focus:ring-violet-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp / Telegram (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    type="tel" 
                    placeholder="+1234..." 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 rounded-2xl border-slate-100 focus:ring-violet-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes / Inquiry Details</label>
                <Textarea 
                  placeholder="Intelligence contribution or technical query..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="min-h-[120px] rounded-2xl border-slate-100 focus:ring-violet-600 bg-slate-50/50 resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-violet-200"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
