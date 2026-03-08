import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

async function checkLogs() {
    const client = new Client({
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres.dfxhfutflhnxjjpbqscj',
        password: '40%Lacunacoilflames',
        database: 'postgres',
    });

    try {
        await client.connect();

        // Auth schema contains audit log events which might capture SMTP errors
        const res = await client.query(`
      SELECT 
        created_at, action, error, payload 
      FROM auth.audit_log_entries 
      WHERE created_at > NOW() - INTERVAL '2 hours'
      ORDER BY created_at DESC 
      LIMIT 10;
    `);

        console.log("Recent Auth Logs:");
        res.rows.forEach(r => console.log(r));
    } catch (e) {
        console.error("Query Error:", e.message);
    } finally {
        await client.end();
    }
}

checkLogs();
