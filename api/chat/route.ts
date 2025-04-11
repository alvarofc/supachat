import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai'; // Or your preferred provider
import { StreamingTextResponse } from 'ai';

// IMPORTANT: Set the runtime to edge for Vercel Edge Functions
export const runtime = 'edge';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: CoreMessage[] } = await req.json();

    // --- TODO: Load Conversation History & Prepend --- 
    // Later, we will:
    // 1. Extract conversationId from request body/headers.
    // 2. Load existing messages from Supabase using loadConversation(conversationId).
    // 3. Prepend loadedMessages to the 'messages' received from the client.
    const messagesWithHistory = messages; // Use client messages directly for now

    // --- Call the LLM --- 
    const result = await streamText({
      model: openai('gpt-4o-mini'), // Or your preferred model
      // system: "You are a helpful assistant...", // Add system prompt if needed
      messages: messagesWithHistory, 
      // --- TODO: Add Temperature, Max Tokens, etc. settings --- 

      // --- TODO: Add Tool Definitions if needed --- 
    });

    // --- Return the Stream --- 
    // The Vercel AI SDK handles transforming the stream into the correct format.
    // We don't need to manually save here; saving will be triggered client-side.
    return result.toAIStreamResponse(); 

  } catch (error) {
    console.error("Error in chat API route:", error);
    // Generic error response
    return new Response('Internal Server Error', { status: 500 });
  }
} 