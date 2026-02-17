import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
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
                        <FileText className="w-5 h-5 text-violet-600" />
                        Terms of Service
                    </div>
                    <div className="w-24" /> {/* Spacer for centering */}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-gray-700 leading-relaxed">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
                        <p className="text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">1. Agreement to Terms</h2>
                        <p>
                            By accessing or using Smart Notes ("the Application"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">2. Intellectual Property Rights</h2>
                        <p>
                            Unless otherwise indicated, the Application is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Application (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">3. User Representations</h2>
                        <p>By using the Application, you represent and warrant that:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>All registration information you submit will be true, accurate, current, and complete.</li>
                            <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                            <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                            <li>You are not a minor in the jurisdiction in which you reside.</li>
                            <li>You will not access the Application through automated or non-human means, whether through a bot, script or otherwise.</li>
                            <li>You will not use the Application for any illegal or unauthorized purpose.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">4. Prohibited Activities</h2>
                        <p>
                            You may not access or use the Application for any purpose other than that for which we make the Application available. The Application may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">5. User Generated Contributions</h2>
                        <p>
                            The Application may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Application, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions").
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">6. Modifications and Interruptions</h2>
                        <p>
                            We reserve the right to change, modify, or remove the contents of the Application at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Application. We also reserve the right to modify or discontinue all or part of the Application without notice at any time.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">7. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and defined following the laws of Indonesia. Smart Notes and yourself irrevocably consent that the courts of Indonesia shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-900">8. Contact Us</h2>
                        <p>
                            In order to resolve a complaint regarding the Application or to receive further information regarding use of the Application, please contact us at support@notes.biz.id.
                        </p>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
}
