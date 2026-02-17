
const { Client } = require('pg');

const connectionString = "postgresql://postgres:40%Lacunacoilflames@db.dfxhfutflhnxjjpbqscj.supabase.co:5432/postgres";

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL DEFAULT '',
    content text DEFAULT '',
    color text DEFAULT 'default',
    is_pinned boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    tags text[] DEFAULT array[]::text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Enable RLS
  ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

  -- Create Policies (Drop existing to avoid conflicts)
  DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

  CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);
`;

async function setupDb() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    console.log('Running schema creation...');
    await client.query(createTableQuery);
    console.log('✅ Schema applied successfully!');

  } catch (err) {
    console.error('❌ Error applying schema:', err);
  } finally {
    await client.end();
  }
}

setupDb();
