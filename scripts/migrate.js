import pkg from 'pg';
const { Client } = pkg;
// Explicit config to avoid URL encoding issues
const client = new Client({
    user: 'postgres.dfxhfutflhnxjjpbqscj',
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    database: 'postgres',
    password: '40%Lacunacoilflames',
    port: 6543,
    ssl: { rejectUnauthorized: false } // Required for Supabase functions/poolers sometimes
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database...');

        const query = `
      -- Create notes table if not exists (using manual SQL just in case)
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

      -- Check if policies exist before creating
      DO $$
      BEGIN
        IF NOT EXISTS (
           SELECT FROM pg_catalog.pg_policies 
           WHERE  tablename = 'notes' 
           AND    policyname = 'Users can view their own notes'
        ) THEN
           CREATE POLICY "Users can view their own notes" ON notes
             FOR SELECT USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
           SELECT FROM pg_catalog.pg_policies 
           WHERE  tablename = 'notes' 
           AND    policyname = 'Users can insert their own notes'
        ) THEN
           CREATE POLICY "Users can insert their own notes" ON notes
             FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
           SELECT FROM pg_catalog.pg_policies 
           WHERE  tablename = 'notes' 
           AND    policyname = 'Users can update their own notes'
        ) THEN
           CREATE POLICY "Users can update their own notes" ON notes
             FOR UPDATE USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (
           SELECT FROM pg_catalog.pg_policies 
           WHERE  tablename = 'notes' 
           AND    policyname = 'Users can delete their own notes'
        ) THEN
           CREATE POLICY "Users can delete their own notes" ON notes
             FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END
      $$;

      console.log('Migration completed successfully.');
    `;

        // We execute in parts to avoid issues with DO block mixed with other statements if driver is picky, 
        // but pg driver usually handles it fine. Let's send as one block or split if needed.
        // The DO block helps with idempotency.
        await client.query(query);
        console.log('Schema setup finished.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
