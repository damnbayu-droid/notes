import { useState, useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    verified: boolean;
    joined: string;
}

// Mock user data for demonstration
const INITIAL_USERS: AdminUser[] = [
    { id: '1', email: 'user@example.com', name: 'John Doe', verified: false, joined: '2023-01-15' },
    { id: '2', email: 'sarah@test.com', name: 'Sarah Smith', verified: true, joined: '2023-02-20' },
    { id: '3', email: 'guest123@temp.com', name: 'Guest User', verified: false, joined: '2023-03-10' },
    { id: '4', email: 'damnbayu@gmail.com', name: 'Admin Bayu', verified: true, joined: '2022-12-01' },
];

export function AdminUserList() {
    const [users, setUsers] = useState<AdminUser[]>(() => {
        const saved = localStorage.getItem('admin_users_list');
        if (saved) {
            return JSON.parse(saved);
        }
        return INITIAL_USERS;
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        localStorage.setItem('admin_users_list', JSON.stringify(users));
        // Dispatch event so AdOverlay can react if needed (though it likely polls or mounts on login)
        window.dispatchEvent(new Event('storage'));
    }, [users]);

    const toggleVerification = (userId: string) => {
        setUsers(users.map(user => {
            if (user.id === userId) {
                const newStatus = !user.verified;
                toast.success(`User ${user.email} is now ${newStatus ? 'Verified' : 'Unverified'}`);
                return { ...user, verified: newStatus };
            }
            return user;
        }));
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold">User Management</CardTitle>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableCaption>List of all registered users.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.joined}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.verified ? "default" : "secondary"} className={user.verified ? "bg-green-600 hover:bg-green-700" : ""}>
                                            {user.verified ? (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> Unverified
                                                </span>
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-sm text-muted-foreground">Verify</span>
                                            <Switch
                                                checked={user.verified}
                                                onCheckedChange={() => toggleVerification(user.id)}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
