/**
 * GitHub Service for Smart Notes
 * Handles fetching repository contents and raw file data for collaborative notes.
 */

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: "file" | "dir";
  content?: string;
  encoding?: string;
}

export class GitHubService {
  private baseUrl = "https://api.github.com";

  /**
   * Parse a GitHub URL to extract owner, repo, and path.
   * Format: https://github.com/owner/repo/blob/branch/path/to/file
   * Also supports: https://github.com/owner/repo/raw/branch/path/to/file
   */
  public parseUrl(url: string) {
    try {
      // Clean URL: remove query params and trailing fragments
      const cleanUrl = url.split('?')[0].split('#')[0].replace(/\/$/, '');
      
      // Support patterns:
      // 1. https://github.com/owner/repo/blob/branch/path
      // 2. https://github.com/owner/repo/raw/branch/path
      // 3. https://github.com/owner/repo/blame/branch/path
      // 4. https://raw.githubusercontent.com/owner/repo/branch/path (Accept Raw URLs directly)
      const regex = /(?:github\.com|raw\.githubusercontent\.com)\/([^/]+)\/([^/]+)(?:\/(?:blob|raw|blame|tree)\/([^/]+)\/(.+))?/;
      const match = cleanUrl.match(regex);
      
      if (!match) {
        // Fallback for simple repo URL: https://github.com/owner/repo
        const simpleRegex = /github\.com\/([^/]+)\/([^/]+)$/;
        const simpleMatch = cleanUrl.match(simpleRegex);
        if (simpleMatch) {
          const [, owner, repo] = simpleMatch;
          return { owner, repo, branch: "main", path: "" };
        }
        return null;
      }
      
      const [, owner, repo, segment, path] = match;
      
      // Special handling for raw.githubusercontent.com which has No segment
      if (cleanUrl.includes('raw.githubusercontent.com')) {
        const parts = cleanUrl.split('/').filter(Boolean).slice(2); // Remove https: and raw.githubusercontent.com
        const [owner, repo, branch, ...pathParts] = parts;
        return { owner, repo, branch: branch || "main", path: pathParts.join('/') || "" };
      }

      return { owner, repo, branch: segment === 'main' || segment === 'master' ? segment : (match[3] || "main"), path: path || "" };
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch file content from a repository.
   */
  public async fetchFileContent(owner: string, repo: string, path: string, branch: string = "main"): Promise<string> {
    try {
      if (!path) throw new Error('Note Intelligence requires a specific file path. Please link directly to a technical asset.');

      // Try raw.githubusercontent.com first
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
      const response = await fetch(rawUrl);
      
      if (!response.ok) {
        // Fallback: Try 'master' if 'main' fails
        if (branch === 'main') {
          return this.fetchFileContent(owner, repo, path, 'master');
        }
        throw new Error(`GitHub Security Protocol: Access Denied or File Not Found (${response.status}). Verify the resource is public.`);
      }
      
      return await response.text();
    } catch (error: any) {
      console.error("GitHub fetch error:", error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('GitHub Security Block: Browser CORS policy restricted the direct fetch. Try using the direct "Raw" URL from GitHub instead.');
      }
      throw error;
    }
  }

  /**
   * Fetch repository directory listing.
   */
  public async fetchRepoContents(owner: string, repo: string, path: string = ""): Promise<GitHubContent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch repo contents: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("GitHub API error:", error);
      throw error;
    }
  }
}

export const githubService = new GitHubService();
