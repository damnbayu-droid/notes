import { useParams } from 'react-router-dom';
import { 
  Shield, 
  Bot, 
  Scan, 
  Mic, 
  Compass, 
  Github, 
  Book, 
  Calendar,
  Zap,
  Lock,
  Search,
  Cloud,
  Layers,
  Pencil,
  CheckCircle2,
  FileText,
  Users,
  MessageSquare,
  LayoutGrid,
  Clock,
  ExternalLink,
  Eye,
  Sparkles,
  Smartphone,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/seo/SEO';

interface FeatureContent {
    id: string;
    title: string;
    description: string;
    icon: any;
    sections: {
        title: string;
        content: string;
        icon?: any;
    }[];
}

const FEATURE_DATA: Record<string, FeatureContent> = {
    'encryption': {
        id: 'encryption',
        title: 'Military-Grade Encryption',
        description: 'The world\'s most secure Smart Filing System with end-to-end AES-GCM 256-bit protection.',
        icon: Shield,
        sections: [
            { title: 'AES-GCM 256-Bit Standard', content: 'We utilize industry-leading encryption protocols that are trusted by banks and military institutions worldwide. Your notes are shielded before they ever leave your device.', icon: Lock },
            { title: 'Zero-Knowledge Architecture', content: 'Our "Zero-Knowledge" policy means only you hold the keys. Not even our engineers can access your secured files.', icon: Eye },
            { title: 'Immutable Audit Logs', content: 'Track every access and change with transparent, immutable logs that ensure total data integrity for your personal workspace.', icon: Sparkles },
            { title: 'Hardware-Level Security', content: 'Optional integration with biometric sensors ensures that physical access to your device is as secure as digital access.', icon: Smartphone },
            { title: 'Encrypted Media Assets', content: 'Every photo, scan, and voice note is encrypted at the bit-level, providing a 360-degree security perimeter.', icon: Layers },
            { title: 'Local-First Decryption', content: 'Performance is never sacrificed. Decryption happens instantly on your device, ensuring a lag-free experience.', icon: Zap },
            { title: 'Secure Multi-Device Sync', content: 'Synchronize your encrypted vault across all devices without exposing your master keys to the cloud.', icon: Cloud },
            { title: 'Privacy-First Policy', content: 'ZERO tracking. ZERO third-party access. Your thoughts remain your own, forever.', icon: Shield },
            { title: 'Recovery Safeguards', content: 'Advanced recovery protocols (Mnemonic keys) ensure you never lose access to your life\'s work.', icon: CheckCircle2 },
            { title: 'Audit-Ready Reporting', content: 'Generate security reports to verify your data protection status at any time.', icon: Search },
        ]
    },
    'ai-intelligence': {
        id: 'ai-intelligence',
        title: 'WK_Ai Intelligence Engine',
        description: 'Transform your thoughts into structured wisdom with advanced AI-driven note mastery.',
        icon: Bot,
        sections: [
            { title: 'Automated Goal Summarization', content: 'Let WK_Ai distill your long-form notes into actionable bullet points and high-level strategy summaries in seconds.', icon: Bot },
            { title: 'Intelligent Auto-Tagging', content: 'Our engine analyzes context to automatically suggest and apply tags, keeping your library organized without the effort.', icon: Sparkles },
            { title: 'Contextual Knowledge Linking', content: 'AI finds the hidden connections between your notes, creating a second brain that thinks the way you do.', icon: Layers },
            { title: 'Real-Time Transcription', content: 'Convert voice recordings into perfectly punctuated text with 99% accuracy using our deep learning models.', icon: Mic },
            { title: 'AI-Generated Reading Lists', content: 'Based on your notes, the engine generates reading priorities and learning paths tailored to your interests.', icon: Search },
            { title: 'Creative Brainstorming Partner', content: 'Stuck? Ask the AI to expand on your ideas, providing new perspectives and industrial-grade insights.', icon: Zap },
            { title: 'Multilingual Mastery', content: 'WK_Ai understands and translates over 50 languages, making your smart filing system global.', icon: Compass },
            { title: 'Smart Search Intelligence', content: 'Search by meaning, not just keywords. Find thoughts based on concepts and emotional context.', icon: Search },
            { title: 'Daily AI Briefings', content: 'Wake up to a smart summary of your most critical pending tasks and related notes.', icon: Calendar },
        ]
    },
    'smart-filing': {
        id: 'smart-filing',
        title: 'Smart Filing System (GitHub Sync)',
        description: 'Native repository synchronization and persistent resource linking for developers and researchers.',
        icon: Github,
        sections: [
            { title: 'Persistent GitHub Linking', content: 'Connect your notes directly to specific files in your repositories. Track your logic alongside your code.', icon: Github },
            { title: 'Live Source Integration', content: 'Open your original code files or spreadsheets directly from the Note Editor with a single "Smart CTA".', icon: Sparkles },
            { title: 'Version Control for Thoughts', content: 'Sync your note updates with your development cycles, ensuring your documentation never goes stale.', icon: Clock },
            { title: 'External Source Metadata', content: 'Our system stores URL, type, and title metadata for every external resource, creating a permanent audit trail.', icon: Layers },
            { title: 'Google Drive Connectivity', content: 'Native support for Google Docs and Sheets, allowing you to treat cloud files as part of your smart library.', icon: Cloud },
            { title: 'Resource Relationship Mapping', content: 'Visualize how your notes connect to your external files in a powerful dependency graph.', icon: Compass },
            { title: 'Cross-Platform File Access', content: 'Access your linked resources from any device, as long as you have the original source permissions.', icon: Smartphone },
            { title: 'Smart File Audit', content: 'Detect broken links and outdated resources automatically to keep your filing system healthy.', icon: Shield },
        ]
    },
    'ocr-scanner': {
        id: 'ocr-scanner',
        title: 'Ultra OCR Document Scanner',
        description: 'Convert physical reality into digital intelligence with high-fidelity OCR scanning.',
        icon: Scan,
        sections: [
            { title: 'Multi-Modal OCR Engine', content: 'Extract text from images, PDFs, and handwritten notes with industrial accuracy. Our engine supports over 100 languages.', icon: Scan },
            { title: 'Automatic Edge Detection', content: 'The built-in camera intelligence automatically crops and de-skews your documents for perfect clarity.', icon: Eye },
            { title: 'Real-Time Batch Scanning', content: 'Scan entire folders of documents in a single session. Let the AI process them in the background while you work.', icon: Layers },
            { title: 'Direct PDF Transcription', content: 'Upload any PDF and watch as WK_Ai converts the visual data into editable, searchable notes instantly.', icon: FileText },
            { title: 'Metadata Extraction', content: 'Automatically identify dates, totals, and keywords from receipts and invoices for easy categorization.', icon: Search },
            { title: 'High-Contrast Enhancement', content: 'Advanced filters ensure that even poor lighting conditions result in readable, high-quality digital assets.', icon: Zap },
            { title: 'Seamless Library Integration', content: 'Scans are instantly saved to your selected folder and encrypted with your master key.', icon: Shield },
            { title: 'Shareable PDF Export', content: 'Re-export your processed scans as sleek, professionally formatted PDFs with built-in searchable text layers.', icon: Share2 }
        ]
    },
    'voice-notes': {
        id: 'voice-notes',
        title: 'Smart Voice Notes',
        description: 'Capture your voice with lossless fidelity and transform it into perfectly structured intelligence.',
        icon: Mic,
        sections: [
            { title: 'Lossless Audio Capture', content: 'Professional-grade recording that preserves every nuance of your voice for future reference.', icon: Mic },
            { title: 'Live AI Punctuation', content: 'Our AI adds proper grammar, periods, and commas to your speech in real-time as you dictate.', icon: Bot },
            { title: 'Speaker Diarization', content: 'Identify multiple speakers in a recording automatically, perfect for meeting minutes and interviews.', icon: Users },
            { title: 'Dynamic Audio Visualizer', content: 'Experience real-time visual feedback on your recording levels with our sleek, responsive waveform UI.', icon: Zap },
            { title: 'Instant Summary Generation', content: 'Finish a recording and receive an AI-generated summary of the key points before you even hit save.', icon: Sparkles },
            { title: 'Voice-to-Task Conversion', content: 'Say "Reminder tomorrow at 9" and watch as the AI automatically schedules the event in your calendar.', icon: Calendar },
            { title: 'Global Multi-Language Support', content: 'Record and transcribe in your native tongue. Our models are trained on diverse accents and dialects.', icon: Compass },
            { title: 'Encrypted Voice Vault', content: 'Your voice files are encrypted locally, ensuring your private conversations remain private.', icon: Lock }
        ]
    },
    'book-mode': {
        id: 'book-mode',
        title: 'Digital Book Mode',
        description: 'Transform your scattered notes into structured, elegant digital books for deep reading.',
        icon: Book,
        sections: [
            { title: 'Automated Book Compilation', content: 'Select a series of notes and let our engine automatically generate a table of contents and chapter structure.', icon: Book },
            { title: 'Premium Typography', content: 'Experience reading in a distraction-free, professional environment optimized for long-form study.', icon: Sparkles },
            { title: 'Interactive Annotations', content: 'Highlight and add marginalia to your compiled books while preserving the original note content.', icon: Pencil },
            { title: 'Cross-Note Hyperlinking', content: 'Create seamless links between sections of your book, building a web of interconnected knowledge.', icon: Layers },
            { title: 'Multi-Device Reading Progress', content: 'Start reading on your desktop and pick up exactly where you left off on your mobile device.', icon: Smartphone },
            { title: 'Export to EPUB/PDF', content: 'Once your book is ready, export it to professional formats for use in Kindle or other e-readers.', icon: FileText },
            { title: 'Dark Mode Optimization', content: 'A reading environment that adapts to your eyes, featuring OLED-friendly dark themes and sepia tones.', icon: Eye },
            { title: 'AI-Powered Research Summaries', content: 'Generate a meta-summary of your entire book to find the overall core thesis and outliers.', icon: Bot }
        ]
    },
    'scheduling': {
        id: 'scheduling',
        title: 'Automated Scheduling & Alarms',
        description: 'Never miss a thought. Integrated calendars and smart notifications keep you on track.',
        icon: Calendar,
        sections: [
            { title: 'Bali-Time AI Scheduling', content: 'Set smart reminders that account for your timezone and current cognitive load for optimal timing.', icon: Clock },
            { title: 'Integrated Notification Center', content: 'A centralized portal for all your due notes, alarms, and system updates in our Dynamic Island.', icon: Zap },
            { title: 'Recurring Note Tasking', content: 'Set daily, weekly, or monthly reminders for repetitive habits and knowledge reviews.', icon: Calendar },
            { title: 'Urgent Push Notifications', content: 'Get critical alerts even when the app is closed, ensuring you never miss a deadline.', icon: MessageSquare },
            { title: 'Calendar Grid View', content: 'Visualize your knowledge timeline with a powerful monthly and weekly grid interface.', icon: LayoutGrid },
            { title: 'Automated "Note Review" Cycles', content: 'Our system prompts you to review old notes at optimal intervals for maximum retention.', icon: Bot },
            { title: 'High-Priority Alert Levels', content: 'Categorize your notifications from "Subtle Reminder" to "Critical Warning" with custom soundscapes.', icon: Shield },
            { title: 'Sync with System Calendar', content: 'Export your Note reminders to Google Calendar or Apple Calendar with a single click.', icon: Share2 }
        ]
    },
    'collaborative': {
        id: 'collaborative',
        title: 'Collaborative Workspaces',
        description: 'Share and build knowledge together with real-time multi-user synchronization.',
        icon: Users,
        sections: [
            { title: 'Real-Time Shared Editing', content: 'Invite collaborators and watch as changes appear instantly with high-performance cursor tracking.', icon: Users },
            { title: 'Granular Access Policies', content: 'Set permissions to "Read Only" or "Read & Write" for every shared resource in your library.', icon: Lock },
            { title: 'Threaded Note Comments', content: 'Collaborate within the note itself using community-driven comments and rating systems.', icon: MessageSquare },
            { title: 'Global Discovery Feed', content: 'Share your intelligence with the world and allow others to build upon your public contributions.', icon: Compass },
            { title: 'Secure Invitation Links', content: 'Generated slug-based links provide temporary or permanent access without account sharing.', icon: ExternalLink },
            { title: 'Activity Audit Trail', content: 'See exactly who changed what and when with our detailed collaboration logs.', icon: Clock },
            { title: 'Collaborative Search', content: 'Search across your team\'s shared vault just as easily as you search your personal one.', icon: Search },
            { title: 'Team-Level Encription', content: 'Shared notes use multi-party encryption to ensure only authorized team members can decrypt the data.', icon: Shield }
        ]
    }
};

export default function FeaturePage() {
    const { slug } = useParams();
    const data = slug ? FEATURE_DATA[slug] : null;

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
                <div className="text-center space-y-4">
                    <Shield className="w-16 h-16 text-gray-200 mx-auto" />
                    <h1 className="text-2xl font-bold">Feature not found</h1>
                    <p className="text-gray-500">We are constantly adding new intelligence capabilities.</p>
                    <Button onClick={() => window.location.href = '/'}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <SEO 
                title={`${data.title} - Smart Notes Features`}
                description={data.description}
            />
            
            {/* Hero Section */}
            <header className="relative py-20 sm:py-32 px-6 overflow-hidden border-b border-gray-100 dark:border-gray-900">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full opacity-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
                </div>
                
                <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-full text-violet-600 dark:text-violet-400 font-black uppercase tracking-widest text-[10px] animate-in slide-in-from-top-4 duration-500">
                        <Sparkles className="w-3 h-3" />
                         CORE FUNCTIONALITY
                    </div>
                    
                    <h1 className="text-4xl sm:text-7xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight leading-none animate-in fade-in duration-700">
                        {data.title}
                    </h1>
                    
                    <p className="text-lg sm:text-2xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
                        {data.description}
                    </p>

                    <div className="pt-8 flex flex-wrap justify-center gap-4">
                        <Button className="h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-violet-500/20 transition-all active:scale-95">
                            Get Started Now
                        </Button>
                        <Button variant="outline" className="h-14 rounded-2xl px-8 font-black uppercase tracking-widest text-xs border-2">
                            Watch Demo
                        </Button>
                    </div>
                </div>
            </header>

            {/* Feature Sections Grid */}
            <section className="py-20 sm:py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                        {data.sections.map((section, idx) => (
                            <div 
                                key={idx} 
                                className="group p-8 sm:p-12 bg-gray-50/50 dark:bg-gray-900/30 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 transition-all hover:bg-white dark:hover:bg-gray-900 hover:shadow-2xl hover:border-violet-200"
                            >
                                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-8 shadow-md group-hover:scale-110 transition-transform">
                                    {section.icon ? <section.icon className="w-7 h-7 text-violet-600" /> : <Shield className="w-7 h-7 text-violet-600" />}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight mb-4 leading-tight">
                                    {section.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-black text-white text-center rounded-t-[4rem] px-6">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">Ready to Master Your Intelligence?</h2>
                    <p className="text-gray-400 text-lg sm:text-xl font-medium">Join thousands of users who have secured their thoughts with Smart Notes today.</p>
                    <Button className="h-16 bg-white text-black hover:bg-gray-200 rounded-2xl px-12 font-black uppercase tracking-widest text-sm transition-all active:scale-95">
                        Create Free Account
                    </Button>
                </div>
            </section>
        </div>
    );
}
