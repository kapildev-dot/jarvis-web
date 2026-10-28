const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.generateAIResponse = async (message, context = {}) => {

    // ==========================================
    // CHECK API KEY
    // ==========================================

    if (!process.env.OPENAI_API_KEY) {

        console.error(
            "OPENAI_API_KEY is missing from .env"
        );

        return {
            success: false,
            configured: false,
            reply: "OpenAI API is not configured on the backend."
        };
    }


    // ==========================================
    // VALIDATE MESSAGE
    // ==========================================

    if (
        !message ||
        typeof message !== "string"
    ) {

        return {
            success: false,
            configured: true,
            reply: "Please provide a valid message."
        };
    }


    try {

        // ======================================
        // JARVIS INSTRUCTIONS
        // ======================================

        const instructions = `
You are KAPISH JARVIS, a helpful AI assistant
for a college student.

Your job is to help with:

- Programming
- Web development
- DBMS
- SQL
- PL/SQL
- Python
- C++
- JavaScript
- HTML
- CSS
- React
- Node.js
- Computer science subjects
- Exam preparation
- Study planning
- General academic questions

IMPORTANT RULES:

1. Explain difficult concepts in simple language.

2. For programming questions, give correct,
   beginner-friendly explanations and code when useful.

3. When the user asks for current, latest, today's,
   recent, live, real-time, news, weather, prices,
   events, or other changing information,
   use web search when necessary.

4. Never invent current information.

5. If web search is used, base the answer on
   the information returned by the search.

6. If you are unsure about something, say so
   instead of making up an answer.

7. Keep normal answers reasonably concise.

8. For exam questions, explain the concept first
   and then provide an exam-ready answer when useful.

9. Use clear formatting with headings, bullets,
   numbered points, and code blocks when appropriate.

10. The assistant name is KAPISH JARVIS.
`;


        // ======================================
        // USER CONTEXT
        // ======================================

        let userInput = message;

        if (
            context &&
            typeof context === "object" &&
            Object.keys(context).length > 0
        ) {

            userInput += `

Additional context:
${JSON.stringify(context)}
`;
        }


        // ======================================
        // OPENAI RESPONSES API
        // ======================================

        const response =
            await client.responses.create({

                model: "gpt-5.6-luna",

                instructions: instructions,

                input: userInput,

                tools: [
                    {
                        type: "web_search"
                    }
                ]
            });


        // ======================================
        // GET RESPONSE TEXT
        // ======================================

        const reply =
            response.output_text;


        if (!reply) {

            console.error(
                "OpenAI returned an empty response:",
                response
            );

            return {
                success: false,
                configured: true,
                reply: "OpenAI returned an empty response."
            };
        }


        // ======================================
        // SUCCESS
        // ======================================

        return {

            success: true,

            configured: true,

            reply: reply

        };


    } catch (error) {

        // ======================================
        // DETAILED ERROR LOGGING
        // ======================================

        console.error(
            "\n========== OPENAI API ERROR =========="
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Status:",
            error.status
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Type:",
            error.type
        );

        console.error(
            "Name:",
            error.name
        );

        console.error(
            "Full Error:",
            error
        );

        console.error(
            "======================================\n"
        );


        // ======================================
        // RETURN ERROR TO FRONTEND
        // ======================================

        return {

            success: false,

            configured: true,

            reply:
                "OpenAI Error: " +
                (
                    error.message ||
                    "Unknown OpenAI API error."
                )

        };
    }
};