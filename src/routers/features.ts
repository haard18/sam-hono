import { Hono } from "hono";
import axios from "axios";
import { cors } from "hono/cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
const featRouter = new Hono();
featRouter.use(cors());
featRouter.post('/aiSummary', async (c) => {
    try {
        const requestBody = await c.req.json();
        const messages = requestBody.messages; // Access the messages property

        if (!Array.isArray(messages)) {
            return c.json({ error: "Messages should be an array" });
        }

        const prompt = "Can you generate a summary of the following messages?";
        const formattedMessages = messages.map((msg, index) => `Message ${index + 1}: ${msg}`).join(" ");
        const combinedMessage = `${prompt} ${formattedMessages}`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([combinedMessage]);
        const summary = result.response.text();

        return c.json({ summary });
    }
    catch (error) {
        console.error("Error generating summary:", error);
        return c.json({ error: "Failed to generate summary" });
    }
});
export default featRouter