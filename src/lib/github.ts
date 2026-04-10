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
   */
  public parseUrl(url: string) {
    try {
      const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/blob\/([^/]+)\/(.+))?/;
      const match = url.match(regex);
      if (!match) return null;

      const [, owner, repo, branch, path] = match;
      return { owner, repo, branch: branch || "main", path: path || "" };
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch file content from a repository.
   */
  public async fetchFileContent(owner: string, repo: string, path: string, branch: string = "main"): Promise<string> {
    try {
      // Use the raw.githubusercontent.com for simpler text retrieval
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
      const response = await fetch(rawUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error("GitHub fetch error:", error);
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
