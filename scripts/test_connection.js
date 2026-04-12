import pg from 'pg';
const { Client } = pg;

// Testing connection to the OLD database from .env
const client = new Client({
    user: 'postgres.dfxhfutflhnxjjpbqscj',
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    database: 'postgres',
    password: '40%Lacunacoilflames',
    port: 6543,
});

async function main() {
    try {
        console.log('Connecting to OLD Supabase (dfxhfutflhnxjjpbqscj)...');
        await client.connect();
        console.log('✅ Connection Successful!');
        const res = await client.query('SELECT current_user, now();');
        console.log(res.rows[0]);
    } catch (err) {
        console.error('❌ Connection Failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
