import { createClient } from '@/lib/supabase/server'
import { Note } from '@/types'

const MAX_DEPTH = 3
const MAX_NODES = 50

// Infrastructure: Recursive Knowledge Fetcher (v11.0.0-PROD)
export async function buildGraph(slug: string, versionId?: string, currentDomain: string = 'default', userAccess: 'free' | 'pro' = 'free') {
  const supabase = await createClient()
  const visited = new Set<string>()
  let nodeCount = 0

  async function recursive(targetSlug: string, depth: number): Promise<any> {
    if (depth > MAX_DEPTH) return null
    if (visited.has(targetSlug)) return null
    if (nodeCount >= MAX_NODES) return null

    visited.add(targetSlug)
    nodeCount++

    let { data: node, error } = await supabase
      .from('notes')
      .select('id, title, content, share_slug, tags, color, updated_at, is_shared, is_discoverable, published_log_id, is_premium, domain, share_type, view_count, click_count, comment_count, permission_count, profiles:user_id(full_name, avatar_url, email)')
      .eq('share_slug', targetSlug)
      .eq('is_shared', true)
      .single()

    // Oracle Fallback: If standard select fails (RLS or Edge restriction), use the security-hardened RPC
    if (error || !node) {
      const { data: rpcNode } = await supabase
        .rpc('get_shared_note_by_slug', { p_slug: targetSlug })
        .single()
      
      if (rpcNode) {
        const castedNode = rpcNode as any
        // Manual profile fetch for bots
        if (castedNode.user_id) {
          const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, email').eq('id', castedNode.user_id).single()
          castedNode.profiles = profile
        }
        node = castedNode
      } else {
        return null
      }
    }
    
    // Safety check for TS compiler
    if (!node) return null

    // DOMAIN GUARD: Strictly enforce boundary ONLY for non-shared paths (internal navigation)
    // For shared content graphs, we allow multi-domain aggregation to ensure full knowledge ingress.
    
    // MONETIZATION LOCK: Depth-based intelligence guard
    let content = node.content
    let isLocked = false

    if (depth > 1 && node.is_premium && userAccess === 'free') {
       content = "🔒 **Premium Intelligence Cluster**: Please upgrade to PRO to unlock this layer of the knowledge graph."
       isLocked = true
    }

    // Version Control Hub (v11.0.0)
    const targetVersion = versionId || (depth === 0 ? node.published_log_id : null)
    if (targetVersion && !isLocked) {
      const { data: logData } = await supabase
        .from('note_logs')
        .select('snapshot_content')
        .eq('id', targetVersion)
        .single()
      
      if (logData?.snapshot_content) {
        content = logData.snapshot_content
      }
    }

    // Fetch children (Layered Discovery)
    const { data: childrenData } = await supabase
      .from('notes')
      .select('share_slug')
      .eq('parent_id', node.id)
      .eq('is_shared', true)
      .eq('domain', currentDomain) // Maintain domain continuity
      .limit(5)

    // Parse implicit links in content
    const implicitSlugs = extractInternalLinks(content || '')
    
    const combinedSlugs = Array.from(new Set([
      ...(childrenData?.map(c => c.share_slug).filter(Boolean) as string[]) || [],
      ...implicitSlugs
    ])).filter(s => s !== targetSlug)

    const children = !isLocked ? await Promise.all(
      combinedSlugs.map(s => recursive(s, depth + 1))
    ) : []

    return {
      ...node,
      content,
      locked: isLocked,
      children: children.filter(Boolean)
    }
  }

  return recursive(slug, 0)
}

export async function getVersionHistory(noteId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('note_logs')
    .select('id, created_at, details')
    .eq('note_id', noteId)
    .not('snapshot_content', 'is', null)
    .order('created_at', { ascending: false })
  return data || []
}

function extractInternalLinks(html: string): string[] {
  // Pattern: /s/[slug]
  const regex = /\/s\/([a-zA-Z0-9_-]{5,})/g
  const matches = [...html.matchAll(regex)]
  return matches.map(m => m[1])
}

export function flattenGraph(node: any): any[] {
  if (!node) return []
  const result = [node]
  if (node.children) {
    node.children.forEach((child: any) => {
      result.push(...flattenGraph(child))
    })
  }
  return result
}
