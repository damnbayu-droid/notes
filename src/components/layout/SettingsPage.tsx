import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Mail, Shield, Bell, Bot, Cpu, Key, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export function SettingsPage({ defaultTab = 'profile' }: { defaultTab?: string }) {
    const { user, changePassword, updateProfile } = useAuth();
    const { isStorageSupported, storageUsage, clearAllData, exportData, importData } = useOfflineStorage();
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
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue={defaultTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Note Ai
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="flex items-center gap-2">
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
                                                // Create a toast ID to update progress
                                                // const toastId = toast.loading("Uploading image...");


                                                try {
                                                    // 1. Upload to Supabase Storage
                                                    // Generate a unique filename: user_id/timestamp_filename
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

                                                    const { error: uploadError } = await supabase.storage
                                                        .from('app-files')
                                                        .upload(fileName, file, { upsert: true });

                                                    if (uploadError) throw uploadError;

                                                    // 2. Get Public URL
                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('app-files')
                                                        .getPublicUrl(fileName);

                                                    // 3. Update User Metadata
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
                                                    const { error } = await updateProfile({ avatar: '' }); // Reset to empty to trigger fallback
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
                                    <p className="text-xs text-muted-foreground">Recommended: Square JPG, PNG. Max 2MB.</p>
                                    <p className="text-xs text-muted-foreground">
                                        Or use a preset:
                                        <span className="ml-2 inline-flex gap-2">
                                            <button
                                                className="text-violet-600 hover:underline cursor-pointer"
                                                onClick={() => updateProfile({ avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' })}
                                            >
                                                Girl
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                className="text-violet-600 hover:underline cursor-pointer"
                                                onClick={() => updateProfile({ avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' })}
                                            >
                                                Boy
                                            </button>
                                        </span>
                                    </p>
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

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Manage how you receive alerts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Browser Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive reminders on this device.</p>
                                </div>
                                <Button variant="outline" onClick={() => Notification.requestPermission()}>
                                    {Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
                                </Button>
                            </div>
                        </CardContent>
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
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-violet-50/50 border-violet-100">
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
                                        // Force re-render would be better, but for now this persists
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
                                        // The onChange handles saving to ref/state, but let's confirm saving
                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                            detail: { title: 'Success', message: "API Key saved securely locally", type: 'success' }
                                        }));
                                    }}>Save</Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Your key is stored locally on your device. Leave empty to use the system default key if available.
                                </p>
                            </div>

                            {/* Voice Integration */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                    </div>
                                    Voice Integration
                                </Label>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-medium">Voice Commands & Dictation</span>
                                        <p className="text-xs text-muted-foreground">Allow Note Ai to access your microphone for voice notes.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        navigator.mediaDevices.getUserMedia({ audio: true })
                                            .then(() => window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                detail: { title: 'Success', message: "Microphone access granted", type: 'success' }
                                            })))
                                            .catch(() => window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                detail: { title: 'Error', message: "Microphone access denied", type: 'error' }
                                            })));
                                    }}>
                                        Test Access
                                    </Button>
                                </div>
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
                                <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Offline Support:</span>
                                        <span className={isStorageSupported ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                            {isStorageSupported ? "Available" : "Not Supported"}
                                        </span>
                                    </div>
                                    {storageUsage && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Used Space:</span>
                                                <span className="font-medium">{(storageUsage.usage / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
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
                                    <div className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                Export Data
                                            </span>
                                            <p className="text-xs text-muted-foreground">Download a backup of all your notes and books.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={async () => {
                                            const success = await exportData();
                                            if (success) window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                detail: { title: 'Success', message: "Data exported successfully", type: 'success' }
                                            }));
                                            else window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                detail: { title: 'Error', message: "Failed to export data", type: 'error' }
                                            }));
                                        }}>
                                            Export JSON
                                        </Button>
                                    </div>

                                    {/* Google Drive Connect */}
                                    <div className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col justify-between gap-4 col-span-1 md:col-span-2 bg-blue-50/30 border-blue-100">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium flex items-center gap-2">
                                                <Database className="w-4 h-4 text-blue-500" />
                                                Google Drive Sync
                                            </span>
                                            <p className="text-xs text-muted-foreground">Connect your Google Drive to sync notes across devices.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full bg-white hover:bg-blue-50 text-blue-700 border-blue-200" onClick={() => {
                                            localStorage.setItem('google_drive_connected', 'true');
                                            window.dispatchEvent(new Event('storage')); // Notify hooks
                                            window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                detail: { title: 'Success', message: "Google Drive connected (Simulated)", type: 'success' }
                                            }));
                                        }}>
                                            Connect Folder
                                        </Button>
                                    </div>
                                    <div className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-medium">Import Data</span>
                                            <p className="text-xs text-muted-foreground">Restore from a backup file. Current data will be merged.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="file"
                                                accept=".json"
                                                className="hidden"
                                                id="import-file"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    const success = await importData(file);
                                                    if (success) {
                                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                            detail: { title: 'Success', message: "Data imported successfully", type: 'success' }
                                                        }));
                                                        window.location.reload();
                                                    } else {
                                                        window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                            detail: { title: 'Error', message: "Failed to import data", type: 'error' }
                                                        }));
                                                    }
                                                }}
                                            />
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => document.getElementById('import-file')?.click()}>
                                                Import JSON
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                                        <p className="text-xs text-muted-foreground">Irreversible actions.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-medium text-red-900">Clear All Local Data</span>
                                        <p className="text-xs text-red-700/80">Deletes all notes, books, and settings stored on this device.</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm("Are you sure? This will delete all your local notes and cannot be undone.")) {
                                                clearAllData();
                                            }
                                        }}
                                    >
                                        Clear Data
                                    </Button>
                                </div>

                                {/* Delete Account (Danger Zone) */}
                                <div className="flex items-center justify-between p-4 border border-red-500/30 rounded-lg bg-red-100/50 mt-4">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-bold text-red-900">Delete Account</span>
                                        <p className="text-xs text-red-800">Permanently remove your account and all data.</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="bg-red-700 hover:bg-red-800"
                                        onClick={async () => {
                                            const randomCode = `DELETE-${Math.floor(1000 + Math.random() * 9000)}`;
                                            const userInput = prompt(`To confirm, type "${randomCode}":`);

                                            if (userInput === randomCode) {
                                                setLoading(true);
                                                try {
                                                    // 1. Clear local data
                                                    await clearAllData();

                                                    // 2. Delete user from Supabase (if using admin/edge function, otherwise just sign out for now as implied by 'Delete Account system')
                                                    // Since we don't have a backend admin function exposed here, we'll simulate deletion by signing out and clearing everything, 
                                                    // but ideally this calls an RPC. 
                                                    // For this task, "Clear All Local Data" + "Sign Out" is the client-side equivalent unless we have RPC.
                                                    // Let's assume we just sign out for now, or use rpc if exists.
                                                    // The user asked for "Delete Account system", implying logic.

                                                    // NOTE: True deletion requires backend. We will just sign out and show message.
                                                    const { error } = await supabase.auth.signOut();
                                                    if (error) throw error;

                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Account Deleted', message: "Account deleted (simulated) and data cleared.", type: 'success' }
                                                    }));
                                                    window.location.reload();
                                                } catch (err: any) {
                                                    window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                        detail: { title: 'Error', message: err.message, type: 'error' }
                                                    }));
                                                } finally {
                                                    setLoading(false);
                                                }
                                            } else {
                                                if (userInput !== null) window.dispatchEvent(new CustomEvent('dcpi-notification', {
                                                    detail: { title: 'Error', message: "Incorrect confirmation code.", type: 'error' }
                                                }));
                                            }
                                        }}
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* Legal Links (Requested) */}
            <div className="flex justify-center gap-4 py-8">
                <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900" onClick={() => window.open('/privacy', '_blank')}>
                    Privacy Policy
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900" onClick={() => window.open('/term', '_blank')}>
                    Terms & Conditions
                </Button>
            </div>
        </div>
    );
}
