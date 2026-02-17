import OpenAI from 'openai';

// Load .env from project root
// Node v20+ supports --env-file flag, so we don't need dotenv here if we run with that flag.
const apiKey = process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.error("❌ VITE_OPENAI_API_KEY is missing in .env");
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function test() {
    try {
        console.log("Testing OpenAI API...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "gpt-3.5-turbo",
        });
        console.log("✅ Success:", completion.choices[0].message.content);
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.code) console.error("Code:", error.code);
        if (error.type) console.error("Type:", error.type);
    }
}

test();
