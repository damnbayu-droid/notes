import { createClient } from '../lib/supabase/client';

async function checkNote() {
  const supabase = createClient();
  const slug = 'neural-intelligence-offloaded-02ac5';
  
  console.log(`Auditing Note Slug: ${slug}`);
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('share_slug', slug)
    .single();
    
  if (error) {
    console.error('Error fetching note:', error.message);
    return;
  }
  
  console.log('Note Metadata:');
  console.log(`ID: ${data.id}`);
  console.log(`Title: ${data.title}`);
  console.log(`Created At: ${data.created_at}`);
  console.log(`Updated At: ${data.updated_at}`);
  console.log('Content Preview:', data.content?.substring(0, 500));
  
  // Check for associated files
  const { data: files } = await supabase
    .from('note_files')
    .select('*')
    .eq('note_id', data.id);
    
  console.log(`Associated Files: ${files?.length || 0}`);
  files?.forEach(f => {
    console.log(`- ${f.file_name} (${f.file_url})`);
  });
}

checkNote();
