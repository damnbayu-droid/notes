import OpenAI from 'openai';







// Tool Definitions
export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "create_note",
            description: "Create a new note in the user's notebook.",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "The title of the note."
                    },
                    content: {
                        type: "string",
                        description: "The body content of the note."
                    },
                    folder: {
                        type: "string",
                        enum: ["Main", "Google Notes", "iCloud Notes"],
                        description: "The folder to place the note in. Default to 'Main' if not specified."
                    }
                },
                required: ["title", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "schedule_reminder",
            description: "Schedule a reminder for a task or note.",
            parameters: {
                type: "object",
                properties: {
                    task: {
                        type: "string",
                        description: "The task description or note title."
                    },
                    datetime_iso: {
                        type: "string",
                        description: "The ISO 8601 date string for when the reminder should fire (e.g., 2023-10-27T10:00:00.000Z). Calculate this based on the user's relative time request."
                    }
                },
                required: ["task", "datetime_iso"]
            }
        }
    }
];

export async function askAI(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> {

    // Check for API key in localStorage (Smart Mode) or env
    const localApiKey = localStorage.getItem('openai_api_key');
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const finalApiKey = localApiKey || envApiKey;

    if (!finalApiKey) {
        return {
            role: 'assistant',
            content: "OpenAI API Key is missing. Please add it in Settings > AI or in your .env file.",
            refusal: null
        };
    }

    // Initialize OpenAI client dynamically
    const openai = new OpenAI({
        apiKey: finalApiKey,
        dangerouslyAllowBrowser: true
    });

    try {
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo",
            tools: tools,
            tool_choice: "auto",
        });

        return completion.choices[0].message;
    } catch (error: any) {
        console.error("AI Error:", error);
        return { role: 'assistant', content: `Error: ${error.message}`, refusal: null };
    }
}
