require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function get() {
  const { data, error } = await supabase.from('notes').select('content, title, share_slug').ilike('title', '%terminal%').order('created_at', {ascending: false}).limit(1);
  if(data) console.log(data[0]);
  if(error) console.error(error);
}
get();
