import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { buildGraph, flattenGraph } from '@/lib/contentGraph'

export const runtime = 'nodejs'

/**
 * AI Search Engine: Chat-Based Intelligence Discovery (v11.0.0-PROD)
 * Powers natural language queries over the Knowledge Graph.
 * Strictly enforces summary-first context to stay within Edge/Token limits.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { query, context_slug } = await req.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Missing query sequence.' }, { status: 400 })
    }

    // 1. Context Acquisition: Fetch the root graph
    // If context_slug is provided, we start from there, otherwise we scan trending/discoverable
    let nodes: any[] = []
    
    if (context_slug) {
      const graph = await buildGraph(context_slug, undefined, 'default', 'pro') // Admin view for reasoning
      nodes = flattenGraph(graph)
    } else {
      // Global Discovery Scan (Top 10 discoverable nodes)
      const { data } = await supabase
        .from('notes')
        .select('id, title, content, share_slug, tags, domain')
        .eq('is_discoverable', true)
        .limit(10)
      nodes = data || []
    }

    // 2. Intelligence Ranking: Keyword Match (Neural Fallback)
    const rankedNodes = nodes
      .map(node => {
        const score = calculateRelevance(query, node)
        return { ...node, score }
      })
      .filter(node => node.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    if (rankedNodes.length === 0) {
      return NextResponse.json({ 
        answer: "I couldn't find any specific intelligence clusters matching your query. Try refining your parameters or searching for broader tags.",
        sources: [] 
      })
    }

    // 3. Context Synthesis: Summary Extraction
    const contextStr = rankedNodes.map(n => {
      const summary = stripHtmlAndTruncate(n.content || '', 400)
      return `[Source: ${n.share_slug} | Title: ${n.title}]
Content Summary: ${summary}
Tags: ${n.tags?.join(', ')}`
    }).join('\n\n---\n\n')

    // 4. LLM Handshake (Pattern: AI Search Protocol)
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    
    let answer = ''
    if (apiKey && apiKey.startsWith('sk-')) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Efficient reasoning model
          messages: [
            {
              role: 'system',
              content: `You are the Smart Notes Intelligence Engine. 
              Your goal is to answer the user's query based ONLY on the provided context nodes. 
              If the information is not in the context, say you don't know. 
              Keep your answer professional, concise, and structured.
              
              Context Nodes:
              ${contextStr}`
            },
            { role: 'user', content: query }
          ],
          temperature: 0.1
        })
      })

      const data = await response.json()
      answer = data.choices?.[0]?.message?.content || 'Neural synthesis failed to produce a valid sequence.'
    } else {
      // Fallback to local synthesis if no API key
      answer = synthesizeAnswer(query, rankedNodes)
    }

    return NextResponse.json({
      answer,
      sources: rankedNodes.map(n => ({
        slug: n.share_slug,
        title: n.title,
        domain: n.domain
      }))
    })

  } catch (err: any) {
    console.error('AI Search Engine Failure:', err)
    return NextResponse.json({ error: 'Neural synthesis failure.' }, { status: 500 })
  }
}

/**
 * Strips HTML tags and truncates for LLM context density.
 */
function stripHtmlAndTruncate(html: string, length: number): string {
  const text = html.replace(/<[^>]*>?/gm, ' ')
  return text.length > length ? text.substring(0, length) + '...' : text
}

/**
 * Calculates a basic relevance score for keyword matching.
 */
function calculateRelevance(query: string, node: any): number {
  const q = query.toLowerCase()
  let score = 0
  if (node.title?.toLowerCase().includes(q)) score += 10
  if (node.content?.toLowerCase().includes(q)) score += 5
  if (node.tags?.some((t: string) => t.toLowerCase().includes(q))) score += 8
  return score
}

/**
 * Synthesizes a structured answer from the ranked nodes.
 * In a real scenario, this would be the LLM output.
 */
function synthesizeAnswer(query: string, nodes: any[]): string {
  // Logic: "Based on the internal intelligence nodes [Source A] and [Source B], here is the summary..."
  const topMatch = nodes[0]
  const summary = stripHtmlAndTruncate(topMatch.content || '', 200)
  
  return `Based on your query "${query}", I've analyzed the knowledge graph. The most relevant cluster is "${topMatch.title}", which discusses "${summary}". 

Additional context is available in the linked source nodes below.`
}
