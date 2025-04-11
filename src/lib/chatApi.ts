import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import { type Message as VercelMessage } from '@ai-sdk/react'; // Import Vercel AI SDK message type

// Define the message structure aligned with Vercel AI SDK
// Include all possible roles for broader compatibility
export interface Message {
  id?: string; // Make id optional since we don't need it for new messages
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  user_id: string;
  updated_at: string;
}

export interface ConversationPreview {
  id: string;
  title: string;
  updated_at: string;
}

// --- Profile/Usage (Copy from previous steps if not already here) ---

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('daily_message_limit, daily_message_count, last_message_sent_at')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error, handle as null
    console.error('Error fetching profile:', error);
  }
  return data; // Returns null if not found or on error
}

export async function updateUserUsage(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('daily_message_count, last_message_sent_at')
        .eq('id', userId)
        .single();

    // If profile doesn't exist, we can't update usage (should have been created on signup)
    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile for usage update:', profileError);
        return;
    }
    if (!currentProfile) {
         console.warn('Profile not found for usage update, user:', userId);
         return;
    }


    let newCount = 1;
    if (currentProfile.last_message_sent_at === today) {
        newCount = (currentProfile.daily_message_count || 0) + 1;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            daily_message_count: newCount,
            last_message_sent_at: today,
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating usage count:', updateError);
    }
}


// --- Conversation Functions (jsonb approach) ---

export async function createConversation(userId: string | null, initialMessage: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId || 'anonymous',
      title: initialMessage.substring(0, 50) + '...',
      messages: [],
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data.id;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('Error getting conversation:', error);
    return null;
  }

  return data;
}

export async function listConversations(userId: string): Promise<ConversationPreview[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error listing conversations:', error);
    return [];
  }

  return data;
}

export async function loadConversation(conversationId: string): Promise<Message[]> {
  if (!conversationId) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading conversation:', error);
  }
  
  // Ensure messages is always an array and convert to our Message type
  const loadedMessages = (data?.messages as any[] | null) ?? [];
  return loadedMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp || msg.createdAt || new Date().toISOString()
  }));
}

export async function saveConversationMessages(
  conversationId: string,
  messages: Message[]
): Promise<boolean> {
  if (!conversationId) {
    console.error("Cannot save messages without conversation ID");
    return false;
  }

  const { error } = await supabase
    .from('conversations')
    .update({
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Error saving conversation messages:', error);
    return false;
  }
  return true;
}

export async function streamChatResponse(
  conversationId: string | null,
  message: string,
  userId: string | null,
  onStream: (chunk: string, remainingMessages: number) => void,
  onError: (error: string) => void
) {
  try {
    // Check remaining messages first
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('message_count, last_message_date')
      .eq('user_id', userId || 'anonymous')
      .single();

    if (profileError) throw new Error('Failed to check message limit');

    // Reset count if it's a new day
    const isNewDay = new Date(userProfile.last_message_date).getDate() !== new Date().getDate();
    const currentCount = isNewDay ? 0 : userProfile.message_count;
    const messageLimit = userId ? 10 : 2;

    if (currentCount >= messageLimit) {
      onError('Daily message limit reached');
      return;
    }

    // Create new conversation if needed
    if (!conversationId) {
      conversationId = await createConversation(userId, message);
      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }
    }

    // Call the Supabase Edge Function for streaming
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message,
        conversationId,
        userId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to initialize stream');

    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      fullResponse += chunk;
      onStream(chunk, messageLimit - (currentCount + 1));
    }

    // Save the messages
    const messageObject: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const assistantMessage: Message = {
      role: 'assistant',
      content: fullResponse,
      timestamp: new Date().toISOString()
    };

    // Update conversation with new messages
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        messages: supabase.rpc('append_messages', {
          conversation_id: conversationId,
          new_messages: [messageObject, assistantMessage]
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) throw new Error('Failed to update conversation');

    // Update user's message count
    const { error: updateCountError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId || 'anonymous',
        message_count: currentCount + 1,
        last_message_date: new Date().toISOString()
      });

    if (updateCountError) throw new Error('Failed to update message count');

  } catch (error) {
    onError(error instanceof Error ? error.message : 'An error occurred');
  }
} 