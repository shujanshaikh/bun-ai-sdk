import { serve } from "bun";
import index from "./index.html";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";

const server = serve({
  routes: {
    "/*": index,

    "/api/chat": {
      async POST(req) {
        const { messages } : { messages: UIMessage[] } = await req.json();

        const stream = createUIMessageStream({
          execute: ({ writer }) => {
            const result = streamText({
              model: google("gemini-2.5-flash-preview-09-2025"),
              messages : convertToModelMessages(messages),
            });
      
            writer.merge(
              result.toUIMessageStream({
                sendStart: false,
                onError: error => {
                  return error instanceof Error ? error.message : String(error);
                },
              }),
            );
          },
        });
        return createUIMessageStreamResponse({ stream });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
