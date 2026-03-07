import { useState } from 'react';
import { convertToWebP } from '@/lib/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Mail, Shield, Bot, Cpu, Key, Database, Phone, Info, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export function SettingsPage({ defaultTab = 'profile', onClose }: { defaultTab?: string, onClose?: () => void }) {
    const { user, changePassword, updateProfile } = useAuth();
    const { isStorageSupported, storageUsage, isConnectedToFolder, syncWithLocalStorage, clearAllData, exportData, importData } = useOfflineStorage();
    const [loading, setLoading] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: "New passwords don't match", type: 'error' }
            }));
            return;
        }

        setLoading(true);
        try {
            const { error } = await changePassword(currentPassword, newPassword);
            if (error) throw new Error(error);

            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Success', message: "Password updated successfully", type: 'success' }
            }));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                detail: { title: 'Error', message: err.message, type: 'error' }
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 px-4 sm:px-0 text-gray-900 dark:text-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </div>
                <Button variant="outline" size="sm" onClick={onClose || (() => window.location.href = '/')} className="shrink-0 gap-2 border-violet-200 hover:bg-violet-50 text-violet-700">
                    <X className="w-4 h-4" />
                    Back to Notes
                </Button>
            </div>

            <Tabs defaultValue={defaultTab} className="space-y-4">
                <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 bg-muted/50 scrollbar-hide">
                    <TabsTrigger value="profile" className="flex items-center gap-2 whitespace-nowrap">
                        <User className="w-4 h-4" />
                        Profile Information
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2 whitespace-nowrap">
                        <Shield className="w-4 h-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2 whitespace-nowrap">
                        <Bot className="w-4 h-4" />
                        Note Ai
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="flex items-center gap-2 whitespace-nowrap">
                        <Database className="w-4 h-4" />
                        Storage
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <div className="flex items-center gap-2 max-w-sm">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <Input value={user?.email || ''} disabled />
                                </div>
                                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={user?.name || ''} disabled className="max-w-sm" />
                                <p className="text-xs text-muted-foreground">Managed via Supabase Auth.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Profile Picture</Label>
                                <div className="flex items-center gap-6">
                                    <div className="relative group w-20 h-20">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-violet-100 shadow-sm">
                                            <img
                                                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Hidden File Input */}
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                if (file.size > 2 * 1024 * 1024) {
                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Error', message: "Image size must be less than 2MB", type: 'error' }
                                                    }));
                                                    return;
                                                }

                                                setLoading(true);
                                                try {
                                                    // Convert to WebP for optimization
                                                    const webpBlob = await convertToWebP(file, 0.8);
                                                    const optimizedFile = new File([webpBlob], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' });

                                                    if (optimizedFile.size > 2 * 1024 * 1024) {
                                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                            detail: { title: 'Error', message: "Optimized image still too large (>2MB)", type: 'error' }
                                                        }));
                                                        return;
                                                    }

                                                    const fileName = `${user?.id}/${Date.now()}.webp`;
                                                    const { error: uploadError } = await supabase.storage
                                                        .from('app-files')
                                                        .upload(fileName, optimizedFile, { upsert: true });

                                                    if (uploadError) throw uploadError;

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('app-files')
                                                        .getPublicUrl(fileName);

                                                    const { error: updateError } = await updateProfile({ avatar: publicUrl });
                                                    if (updateError) throw new Error(updateError);

                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Success', message: "Profile picture updated!", type: 'success' }
                                                    }));
                                                } catch (error: any) {
                                                    console.error("Upload error:", error);
                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Error', message: error.message || "Failed to upload image", type: 'error' }
                                                    }));
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={loading}
                                            onClick={() => document.getElementById('avatar-upload')?.click()}
                                        >
                                            {loading ? 'Uploading...' : 'Upload Photo'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                                            disabled={loading}
                                            onClick={async () => {
                                                if (!confirm("Remove profile picture?")) return;
                                                setLoading(true);
                                                try {
                                                    const { error } = await updateProfile({ avatar: '' });
                                                    if (error) throw new Error(error);
                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Success', message: "Profile picture removed", type: 'success' }
                                                    }));
                                                } catch (err: any) {
                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Error', message: err.message, type: 'error' }
                                                    }));
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                        >
                                            Remove Photo
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 mt-2">
                                    <p className="text-xs text-muted-foreground">Recommended: Square JPG, PNG. Max 2MB. Auto-converted to WebP.</p>
                                    <p className="text-xs text-muted-foreground">
                                        Presets:
                                        <span className="ml-2 inline-flex gap-2">
                                            <button
                                                className="text-violet-600 hover:underline cursor-pointer"
                                                onClick={() => updateProfile({ avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi' })}
                                            >
                                                Girl
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                className="text-violet-600 hover:underline cursor-pointer"
                                                onClick={() => updateProfile({ avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jace' })}
                                            >
                                                Boy
                                            </button>
                                        </span>
                                    </p>
                                </div>
                                <div className="pt-6 border-t mt-6 space-y-6">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-blue-600" />
                                                Enable Notifications
                                            </Label>
                                            <p className="text-xs text-muted-foreground">Stay updated with reminders and security alerts.</p>
                                        </div>
                                        <Switch
                                            checked={typeof window !== 'undefined' && Notification.permission === 'granted'}
                                            onCheckedChange={async (checked) => {
                                                if (checked) {
                                                    const permission = await Notification.requestPermission();
                                                    if (permission === 'granted') {
                                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                            detail: { title: 'Success', message: 'Notifications enabled!', type: 'success' }
                                                        }));
                                                    }
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-4 justify-center sm:justify-start items-center">
                                            <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-violet-600 p-0 h-auto" onClick={() => window.open('/privacy', '_blank')}>
                                                Privacy Policy
                                            </Button>
                                            <span className="text-gray-300">|</span>
                                            <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-violet-600 p-0 h-auto" onClick={() => window.open('/term', '_blank')}>
                                                Terms & Conditions
                                            </Button>
                                            <span className="text-gray-300">|</span>
                                            <Button variant="ghost" size="sm" className="text-xs text-violet-600 font-bold hover:underline p-0 h-auto" onClick={() => window.location.href = '/contact'}>
                                                Contact & Legal
                                            </Button>
                                        </div>
                                        <div className="pt-2 border-t mt-2">
                                            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                                                Partner Links:
                                                <a href="https://bali.enterprises" target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">bali.enterprises</a>
                                                <span className="text-gray-300">|</span>
                                                <a href="https://indonesianvisas.com" target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">indonesianvisas.com</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handlePasswordChange}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current">Current Password</Label>
                                    <div className="relative max-w-sm">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="current"
                                            type="password"
                                            className="pl-9"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new">New Password</Label>
                                    <div className="relative max-w-sm">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="new"
                                            type="password"
                                            className="pl-9"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm">Confirm New Password</Label>
                                    <div className="relative max-w-sm">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="confirm"
                                            type="password"
                                            className="pl-9"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
                                    {loading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                {/* AI Settings Tab */}
                <TabsContent value="ai">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-violet-600" />
                                Note Ai Settings
                            </CardTitle>
                            <CardDescription>Configure your intelligent assistant preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Smart Mode Toggle */}
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-violet-50/50 border-violet-100 dark:bg-violet-900/10 dark:border-violet-900/30">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium flex items-center gap-2">
                                        <Cpu className="w-4 h-4 text-violet-600" />
                                        Smart Mode
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Enable advanced AI features including voice commands and auto-organization.</p>
                                </div>
                                <Switch
                                    checked={localStorage.getItem('smart_mode_enabled') === 'true'}
                                    onCheckedChange={(checked) => {
                                        localStorage.setItem('smart_mode_enabled', String(checked));
                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                            detail: { title: 'Smart Mode', message: `Smart Mode ${checked ? 'Enabled' : 'Disabled'}`, type: 'info' }
                                        }));
                                    }}
                                />
                            </div>

                            {/* API Key Management */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-gray-500" />
                                    OpenAI API Key
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        defaultValue={localStorage.getItem('openai_api_key') || ''}
                                        onChange={(e) => localStorage.setItem('openai_api_key', e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <Button onClick={() => {
                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                            detail: { title: 'Success', message: "API Key saved securely locally", type: 'success' }
                                        }));
                                    }}>Save</Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Your key is stored locally on your device.
                                </p>
                            </div>

                            {/* Voice Integration */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                        </div>
                                        Voice Integration
                                    </Label>
                                    <div
                                        className="p-1.5 rounded-full text-blue-600 dark:text-blue-300 flex items-center gap-1.5 hover:bg-blue-100/50 transition-all cursor-pointer border border-blue-100 dark:border-blue-900/30"
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('dcpi-status', { detail: 'info' }));
                                        }}
                                    >
                                        <Info className="w-3.5 h-3.5" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Feature Info</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Allow Note Ai to access your microphone for voice notes and AI dictation.</p>
                                <Button variant="outline" size="sm" onClick={() => {
                                    navigator.mediaDevices.getUserMedia({ audio: true })
                                        .then(() => window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                            detail: { title: 'Success', message: "Microphone access granted", type: 'success' }
                                        })))
                                        .catch(() => window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                            detail: { title: 'Error', message: "Microphone access denied", type: 'error' }
                                        })));
                                }}>
                                    Test Microphone
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Storage Tab */}
                <TabsContent value="storage">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-violet-600" />
                                Storage & Data
                            </CardTitle>
                            <CardDescription>Manage your local data and offline storage.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Storage Status</h3>
                                <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Offline Support:</span>
                                        <span className={isStorageSupported ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                            {isStorageSupported ? "Available" : "Not Supported"}
                                        </span>
                                    </div>
                                    {storageUsage && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Used Space:</span>
                                                <span className="font-medium">{(storageUsage.usage / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                                <div
                                                    className="bg-violet-600 h-2 rounded-full"
                                                    style={{ width: `${Math.min((storageUsage.usage / storageUsage.quota) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground text-right">
                                                of {(storageUsage.quota / 1024 / 1024).toFixed(0)} MB available
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-medium">Data Management</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-lg hover:bg-muted/30 flex flex-col justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium">Export Data (JSON)</span>
                                            <p className="text-xs text-muted-foreground">Standard backup of notes.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={async () => {
                                            const success = await exportData();
                                            if (success) window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                detail: { title: 'Success', message: "Data exported successfully", type: 'success' }
                                            }));
                                        }}>
                                            Export JSON
                                        </Button>
                                    </div>

                                    <div className={`p-4 border rounded-lg flex flex-col justify-between gap-4 col-span-1 md:col-span-2 transition-all ${isConnectedToFolder ? 'bg-green-50/10 border-green-500/30' : 'bg-blue-50/10 border-blue-500/30'}`}>
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                <Database className={`w-4 h-4 ${isConnectedToFolder ? 'text-green-500' : 'text-blue-500'}`} />
                                                Sync with Local Storage
                                                {isConnectedToFolder && <span className="text-[10px] bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full uppercase font-bold ml-2">Connected</span>}
                                            </span>
                                            <p className="text-xs text-muted-foreground">Connect to a folder on your device for high-speed synchronization.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={async () => {
                                                const res = await syncWithLocalStorage();
                                                if (res) {
                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Success', message: "Local Storage sync enabled!", type: 'success' }
                                                    }));
                                                }
                                            }}
                                        >
                                            {isConnectedToFolder ? 'Reconnect Folder' : 'Connect Folder'}
                                        </Button>
                                    </div>

                                    <div className="p-4 border rounded-lg hover:bg-muted/30 flex flex-col justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium">Export .snb</span>
                                            <p className="text-xs text-muted-foreground">Encrypted backup file.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={async () => {
                                            const pwd = prompt("Enter a password for the encrypted backup:", "smart-notes-locked");
                                            if (!pwd) return;
                                            const success = await exportData(pwd);
                                            if (success) window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                detail: { title: 'Success', message: "Encrypted export complete", type: 'success' }
                                            }));
                                        }}>
                                            Export .snb
                                        </Button>
                                    </div>

                                    <div className="p-4 border rounded-lg hover:bg-muted/30 flex flex-col justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium">Import Data</span>
                                            <p className="text-xs text-muted-foreground">Restore from .snb or .json.</p>
                                        </div>
                                        <Input
                                            type="file"
                                            accept=".snb,.json"
                                            className="hidden"
                                            id="import-file"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const pwd = prompt("Enter password (if any):");
                                                const success = await importData(file, pwd || undefined);
                                                if (success) {
                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Success', message: "Data imported! Reloading...", type: 'success' }
                                                    }));
                                                    setTimeout(() => window.location.reload(), 1000);
                                                }
                                            }}
                                        />
                                        <Button variant="outline" size="sm" onClick={() => document.getElementById('import-file')?.click()}>
                                            Import File
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="p-4 border border-red-200 rounded-lg bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium text-red-900 dark:text-red-400">Clear All Local Data</span>
                                            <p className="text-xs text-red-700/80 dark:text-red-500/70">Irreversible: Deletes all local notes and settings.</p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm("Are you sure? This cannot be undone.")) {
                                                    clearAllData();
                                                }
                                            }}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
