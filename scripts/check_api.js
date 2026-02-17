
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfxhfutflhnxjjpbqscj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmeGhmdXRmbGhueGpqcGJxc2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTg4MjksImV4cCI6MjA4Njg5NDgyOX0.IVwTASlNKoFleBlnzPxbth-ITt71kFhVBmNt4I723yM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        const { data, error } = await supabase.from('notes').select('count', { count: 'exact', head: true });

        if (error) {
            console.log('API Connection Successful, but error querying notes (expected if table missing):', error.message);
        } else {
            console.log('API Connection Successful. Notes table exists.');
        }
    } catch (err) {
        console.error('API Connection Failed:', err);
    }
}

checkConnection();
