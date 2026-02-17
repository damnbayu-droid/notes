import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <Shield className="w-5 h-5 text-violet-600" />
                        Privacy Policy
                    </div>
                    <div className="w-24" /> {/* Spacer for centering */}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-gray-700 leading-relaxed">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
                        <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
                        <p>
                            Welcome to Smart Notes ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website notes.biz.id and use our application.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">2. Information We Collect</h2>
                        <p>We collect information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application, or otherwise when you contact us.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Personal Data:</strong> We may collect personal data such as your name and email address when you create an account.</li>
                            <li><strong>Content:</strong> We store the notes, books, and other content you create within the application.</li>
                            <li><strong>Device Data:</strong> We may automatically collect certain information when you visit, use, or navigate the application. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Your Information</h2>
                        <p>We use personal information collected via our application for a variety of business purposes described below:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To facilitate account creation and logon process.</li>
                            <li>To send you administrative information.</li>
                            <li>To fulfill and manage your orders.</li>
                            <li>To enforce our terms, conditions, and policies.</li>
                            <li>To improve our application and user experience.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">4. Sharing Your Information</h2>
                        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">5. Data Security</h2>
                        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">6. Contact Us</h2>
                        <p>If you have questions or comments about this policy, you may email us at support@notes.biz.id.</p>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
}
