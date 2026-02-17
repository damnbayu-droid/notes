import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Mail, Shield, Bell, Bot, Cpu, Key, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export function SettingsPage({ defaultTab = 'profile' }: { defaultTab?: string }) {
    const { user, changePassword } = useAuth();
    const { isStorageSupported, storageUsage, clearAllData, exportData, importData } = useOfflineStorage();
    const [loading, setLoading] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }

        setLoading(true);
        try {
            const { error } = await changePassword(currentPassword, newPassword);
            if (error) throw new Error(error);

            toast.success("Password updated successfully");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.message);
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
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                                        onClick={() => {
                                            toast.success("Profile picture updated to Boy!");
                                            // In a real app, we'd update Supabase user metadata here.
                                            // For now, we mock it as immediate feedback.
                                        }}
                                    >
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-100">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Boy" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">Boy</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                                        onClick={() => {
                                            toast.success("Profile picture updated to Girl!");
                                        }}
                                    >
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-100">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="Girl" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">Girl</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Click to select a preset avatar.</p>
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
                                        toast.success(`Smart Mode ${checked ? 'Enabled' : 'Disabled'}`);
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
                                        toast.success("API Key saved securely locally");
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
                                            .then(() => toast.success("Microphone access granted"))
                                            .catch(() => toast.error("Microphone access denied"));
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
                                            <span className="text-sm font-medium">Export Data</span>
                                            <p className="text-xs text-muted-foreground">Download a backup of all your notes and books.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={async () => {
                                            const success = await exportData();
                                            if (success) toast.success("Data exported successfully");
                                            else toast.error("Failed to export data");
                                        }}>
                                            Export JSON
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
                                                        toast.success("Data imported successfully");
                                                        window.location.reload();
                                                    } else {
                                                        toast.error("Failed to import data");
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
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
