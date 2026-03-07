import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageSquare, Mail, Phone, ExternalLink, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('dcpi-notification', {
            detail: { title: 'Success', message: 'Support ticket submitted!', type: 'success' }
        }));
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <Globe className="w-5 h-5 text-violet-600" />
                        Contact Us
                    </div>
                    <div className="w-24" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-gray-900">Get in Touch</h1>
                                <p className="text-muted-foreground">Have a question or feedback? We'd love to hear from you.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" placeholder="Your name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="your@email.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="How can we help?" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" placeholder="Write your message here..." className="min-h-[150px]" required />
                                </div>
                                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-lg">
                                    Send Message
                                </Button>
                            </form>
                        </div>

                        {/* Company Info */}
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-violet-600" />
                                    Company Details
                                </h2>
                                <div className="space-y-3">
                                    <p className="font-bold text-gray-800">Smart Notes</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Powered by <strong>Bali Enterprises</strong>.<br />
                                        Creating secure and intelligent solutions for modern productivity.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-violet-600" />
                                    Quick Support
                                </h2>
                                <div className="space-y-4">
                                    <a href="tel:+6285727041992" className="flex items-center gap-3 p-4 rounded-xl border border-violet-100 bg-violet-50/50 hover:bg-violet-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Call Us</p>
                                            <p className="text-xs text-muted-foreground">+62 85727041992</p>
                                        </div>
                                    </a>

                                    <a href="mailto:smart@notes.biz.id" className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Email Support</p>
                                            <p className="text-xs text-muted-foreground">smart@notes.biz.id</p>
                                        </div>
                                    </a>

                                    <a href="https://wa.me/6285727041992" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-green-100 bg-green-50/50 hover:bg-green-50 transition-colors group">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <ExternalLink className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-700">WhatsApp Support</p>
                                            <p className="text-xs text-muted-foreground">Instant chat with our team</p>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <div className="pt-8 border-t">
                                <p className="text-xs text-muted-foreground italic text-center">
                                    Available 24/7 for urgent security concerns.<br />
                                    Average response time: 2-4 hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
