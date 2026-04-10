import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Globe, Loader2, Link as LinkIcon, Database } from 'lucide-react';
import { githubService } from '@/lib/github';

interface OutsourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string, metadata: any) => void;
}

export function OutsourcePicker({ isOpen, onClose, onImport }: OutsourcePickerProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubImport = async () => {
    if (!githubUrl.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parsed = githubService.parseUrl(githubUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL. Please provide a direct link to a file.');
      }

      const content = await githubService.fetchFileContent(parsed.owner, parsed.repo, parsed.path, parsed.branch);
      
      onImport(content, {
        type: 'github_clone',
        url: githubUrl,
        repo: `${parsed.owner}/${parsed.repo}`,
        path: parsed.path,
        branch: parsed.branch,
        is_snapshot: true,
        last_synced: new Date().toISOString()
      });
      
      onClose();
      setGithubUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch GitHub content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-violet-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-violet-900">
            <Database className="w-5 h-5" />
            Add File from Outsource
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="github" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-violet-50/50">
            <TabsTrigger value="github" className="gap-2">
              <Github className="w-4 h-4" /> GitHub
            </TabsTrigger>
            <TabsTrigger value="google" className="gap-2">
              <Globe className="w-4 h-4" /> Google Drive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">GitHub Raw Link or Blob URL</p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/owner/repo/blob/main/README.md"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="bg-white border-violet-100"
                />
                <Button 
                  onClick={handleGitHubImport} 
                  disabled={isLoading || !githubUrl}
                  className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                </Button>
              </div>
              {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
              <p className="text-[10px] text-muted-foreground italic">
                Tip: The content will be cloned as a local snapshot to allow editing without changing the original repo.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="google" className="space-y-4 pt-4">
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-violet-100 rounded-xl bg-violet-50/20">
              <Globe className="w-10 h-10 text-violet-200 mb-2" />
              <p className="text-sm font-medium text-violet-900">Google Drive Integration</p>
              <p className="text-[10px] text-violet-600 mb-4 px-8 text-center">
                Search and select files from your Google Drive account.
              </p>
              <Button 
                variant="outline" 
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
                onClick={() => {
                   window.dispatchEvent(new CustomEvent('dcpi-notification', { 
                     detail: { title: 'Coming Soon', message: 'Google Picker integration is being finalized in Phase 4.', type: 'info' } 
                   }));
                }}
              >
                Select from Drive
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t border-gray-100">
           <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
             <LinkIcon className="w-4 h-4 text-blue-500" />
             <div className="flex-1">
               <p className="text-[10px] font-bold text-blue-900 uppercase">Live Preview Support</p>
               <p className="text-[9px] text-blue-700">Imported code will be auto-formatted for AI readability.</p>
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
