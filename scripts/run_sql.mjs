import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const sqlPath = new URL('../supabase_phase50_setup.sql', import.meta.url).pathname;

async function run() {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const client = new Client({
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres.dfxhfutflhnxjjpbqscj',
        password: '40%Lacunacoilflames',
        database: 'postgres',
    });

    try {
        await client.connect();
        console.log("Connected to DB...");
        await client.query(sql);
        console.log("SQL executed successfully!");
    } catch (e) {
        console.error("SQL Error:", e.message);
    } finally {
        await client.end();
    }
}
run();
