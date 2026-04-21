/**
 * AI Offloading Engine (v16.0.0-STABLE)
 * Optimized for high-density code and prompt payloads.
 */

import { uploadOffloadedFile } from './supabase/storage'
import { createClient } from './supabase/client'

export const OFFLOADING_LIMITS = {
  CHAR_COUNT: 2000,
  LINE_COUNT: 100,
}

/**
 * Detects if content warrants offloading based on length or code density.
 */
export function detectOffloading(text: string): boolean {
  if (!text) return false
  
  const charCount = text.length
  const lineCount = text.split('\n').length
  
  if (charCount > OFFLOADING_LIMITS.CHAR_COUNT) return true
  if (lineCount > OFFLOADING_LIMITS.LINE_COUNT) return true
  
  // Code Density Detection (v1.0)
  const codePatterns = [
    /{[\s\S]*}/, // Curly brace blocks
    /function\s+\w+\s*\(/, // Function definitions
    /import\s+.*\s+from/, // Import statements
    /const\s+\w+\s*=/, // Variable assignments
    /class\s+\w+/, // Class definitions
    /#!/, // Shebang
  ]
  
  const matches = codePatterns.filter(pattern => pattern.test(text))
  if (matches.length >= 2) return true
  
  return false
}

/**
 * Generates a semantic summary for the human view.
 */
export function generateSummary(text: string): string {
  if (!text) return ''
  
  // Clean up content: remove heavy symbols and excessive whitespace
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*'))
    .slice(0, 5) // Take first 5 meaningful lines
  
  const summary = lines.join(' ').substring(0, 300)
  return summary.length < 300 ? summary : `${summary.substring(0, 297)}...`
}

/**
 * Orchestrates the offloading process: Storage + Database Metadata.
 */
export async function processOffloading(
  noteId: string,
  userId: string,
  content: string,
  title: string
) {
  try {
    // 1. Upload to Supabase Storage
    const { url, error } = await uploadOffloadedFile(userId, content)
    if (error || !url) throw new Error(error || 'Failed to upload offloaded file')

    const summary = generateSummary(content)
    const supabase = createClient()

    // 2. Register Metadata in Database
    const { data, error: dbError } = await supabase
      .from('note_files')
      .insert({
        note_id: noteId,
        file_url: url,
        file_hash: 'sha256-hashed', // Hash is handled by storage utility pathing, but can be explicit
        summary: summary,
        original_size: content.length,
        content_type: 'text/markdown'
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 3. Return the replacement content structure
    return {
      success: true,
      summary,
      file_url: url,
      replacement_content: `
        <div class="my-8 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
           <p class="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em] mb-4">Neural Intelligence Offloaded</p>
           <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 italic">"${summary}"</p>
           <a href="${url}" target="_blank" class="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all font-black uppercase text-[10px] tracking-widest">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Access Full Intelligence Node (.md)
           </a>
        </div>
      `
    }
  } catch (err: any) {
    console.error('Offloading Orchestration Failure:', err.message)
    return { success: false, error: err.message }
  }
}
