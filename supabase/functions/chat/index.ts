// Import necessary Deno and AI SDK modules
// Note: For Deno, you might import directly from URLs like esm.sh or vendor dependencies
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, conversationId, userId } = await req.json();

    // Initialize OpenAI
    const openAI = new OpenAIApi(
      new Configuration({
        apiKey: Deno.env.get('OPENAI_API_KEY')
      })
    );

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get conversation history if conversationId exists
    let messages = [];
    if (conversationId) {
      const { data: conversation } = await supabaseClient
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();
      
      if (conversation?.messages) {
        messages = conversation.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // Add the new message
    messages.push({ role: 'user', content: message });

    // Create stream
    const response = await openAI.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true
    }, { responseType: 'stream' });

    // Set up SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // @ts-ignore - OpenAI types don't include stream property
        for await (const chunk of response.data) {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.includes('[DONE]')) {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(line.replace('data: ', ''));
              const token = json.choices[0]?.delta?.content;
              if (token) {
                controller.enqueue(encoder.encode(token));
              }
            } catch (error) {
              console.error('Error parsing chunk:', error);
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Note: You'll need to create a `supabase/functions/_shared/cors.ts` file
// or define CORS headers directly.
// Example cors.ts:
// export const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Or your specific frontend URL
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// }; 