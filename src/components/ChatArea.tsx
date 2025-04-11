import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizonal, Info } from 'lucide-react';
import { cn } from "@/lib/utils"; // For conditional classes
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { canSendMessage, incrementMessageCount, getRemainingMessages } from '@/lib/messageLimiter'; // Keep for Anon users - Using @ alias
import { Message as ClientMessage, loadConversation, saveConversationMessages, createConversation, getUserProfile, updateUserUsage } from '../lib/chatApi'; // Corrected path to use relative import
import { toast } from 'sonner'; // Import Sonner toast
import { useChat, type Message as VercelMessage } from '@ai-sdk/react'; // Import useChat
import { generateId } from 'ai'; // Use for frontend message IDs if needed
import { Link } from '@tanstack/react-router';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Define the initial introductory messages
const initialMessages: Message[] = [
  {
    id: 'intro-1',
    text: 'Welcome to Supachat! ⚡',
    sender: 'ai',
    timestamp: new Date(Date.now() - 2000), // Adjust timing slightly for sequence
  },
  {
    id: 'intro-2',
    text: "I'm an AI assistant specialized in answering questions about Supabase and PostgreSQL.",
    sender: 'ai',
    timestamp: new Date(Date.now() - 1000),
  },
  {
    id: 'intro-3',
    text: 'Feel free to ask me anything about database schemas, authentication, storage, realtime features, or SQL queries!',
    sender: 'ai',
    timestamp: new Date(),
  },
];

// Define prompt suggestions
const promptSuggestions = [
  { title: "Explain RLS", description: "How does row-level security work in Supabase?", prompt: "Explain Supabase row-level security" },
  { title: "Postgres Indexing", description: "What are the best practices for indexing in PostgreSQL?", prompt: "What are the best practices for indexing in PostgreSQL?" },
  { title: "Supabase Auth", description: "Compare JWT and session-based auth in Supabase.", prompt: "Compare JWT and session-based auth in Supabase" },
  { title: "Realtime Example", description: "Show a simple example of using Supabase Realtime.", prompt: "Show a simple example of using Supabase Realtime" },
];

// Get Supabase Function URL from environment variables
const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL;
if (!SUPABASE_FUNCTION_URL) {
  console.warn("VITE_SUPABASE_FUNCTION_URL is not set. Chat functionality will not work.");
}

// Define props
interface ChatAreaProps {
  conversationId: string | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ conversationId }) => {
  const { user } = useAuth();
  // Use prop for initial state management, internal state for hook ID
  const [internalConversationId, setInternalConversationId] = useState<string | null>(conversationId);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // ---- useChat Hook Setup ----
  const { messages, input, handleInputChange, handleSubmit, append, setMessages, isLoading: isLoadingAiResponse } = useChat({
    api: SUPABASE_FUNCTION_URL || '/api/chat',
    id: internalConversationId || undefined,
    initialMessages: [],
    body: {
        conversationId: internalConversationId,
    },
    onFinish: async (message) => {
        // Only increment message count after successful response
        if (user) {
            await updateUserUsage(user.id);
            setRemainingCount(prev => (prev !== null ? Math.max(0, prev - 1) : null));
        } else {
            incrementMessageCount(null);
            setRemainingCount(prev => (prev !== null ? Math.max(0, prev - 1) : null));
        }

        // Save conversation if user is logged in
        if (user && internalConversationId) {
            const finalMessages = [...messages, message];
            const success = await saveConversationMessages(internalConversationId, finalMessages);
            if (!success) toast.error("Failed to save conversation.");
        }
    },
    onError: (error) => {
        toast.error(`Chat error: ${error.message}`);
    }
  });
  // ---- End useChat Hook Setup ----

  // --- Function to load profile and set initial remaining count ---
  const fetchProfileAndUsage = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        const limit = profile.daily_message_limit || 10;
        let currentCount = 0;
        if (profile.last_message_sent_at === today) {
          currentCount = profile.daily_message_count || 0;
        }
        setRemainingCount(Math.max(0, limit - currentCount));
      } else {
        setRemainingCount(10); // Default limit
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setRemainingCount(10); // Default limit on error
    }
  };

  // --- Function to check registered user limit (FIXED) ---
  const checkRegisteredUserLimit = async (userId: string): Promise<boolean> => {
    const profile = await getUserProfile(userId);
    if (!profile) {
        toast.error("Could not verify user limits."); // Notify user
        return false; // Ensure boolean return on error
    }

    const today = new Date().toISOString().split('T')[0];
    const limit = profile.daily_message_limit || 10;
    let currentCount = 0;
    if (profile.last_message_sent_at === today) {
        currentCount = profile.daily_message_count || 0;
    }

    if (currentCount >= limit) {
        toast.error("Daily message limit reached", {
            description: "Upgrade your plan or wait until tomorrow.",
        });
        return false;
    }
    return true;
  };

  // --- Effect to load data when prop changes --- 
  useEffect(() => {
    const loadInitialOrSelectedData = async () => {
        if (user) {
             if (conversationId) {
                // Load the specific conversation passed via prop
                setIsLoadingConversation(true);
                setMessages([]); // Clear hook messages
                const loadedMessages = await loadConversation(conversationId);
                // Convert messages to Vercel AI SDK format
                const convertedMessages = loadedMessages.map(msg => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt || Date.now())
                }));
                setMessages(convertedMessages); // Set messages in the hook
                setInternalConversationId(conversationId); // Sync internal ID
                await fetchProfileAndUsage(user.id); // Refresh usage info
                setIsLoadingConversation(false);
             } else {
                 // No specific conversation selected (e.g., "New Chat" clicked)
                 setIsLoadingConversation(true); // Briefly indicate reset
                 setMessages([]); // Clear hook messages
                 setInternalConversationId(null); // Reset internal ID
                 await fetchProfileAndUsage(user.id);
                 setIsLoadingConversation(false);
             }
        } else {
            // Anonymous user
            setMessages([]);
            setInternalConversationId(null);
            const anonRemaining = getRemainingMessages(null);
            setRemainingCount(anonRemaining);
        }
    };
    loadInitialOrSelectedData();
  }, [user, conversationId, setMessages]); // Depend on conversationId prop

  // --- Custom Submit Handler --- 
  const handleCustomSubmit = async (e?: React.FormEvent<HTMLFormElement> | { prompt: string }) => {
    let promptValue: string | undefined;
    if (typeof e === 'object' && e !== null) {
        if ('prompt' in e) {
            promptValue = e.prompt;
        } else if ('preventDefault' in e && typeof e.preventDefault === 'function') {
            e.preventDefault();
            promptValue = input;
        }
    }
    if (!promptValue?.trim()) return;

    const userId = user?.id || null;
    let canSend = false;

    // Check Limits
    if (userId) {
        canSend = await checkRegisteredUserLimit(userId);
    } else {
        canSend = canSendMessage(null);
        if (!canSend) toast.error("Daily message limit reached", { description: "Please sign up..." });
    }
    if (!canSend) return;

    // Prepare Message
    const messageToSend: VercelMessage = {
        id: generateId(),
        role: 'user',
        content: promptValue,
    };

    // Create conversation if needed
    let conversationIdToUse = internalConversationId;
    if (userId && !conversationIdToUse) {
        setIsLoadingConversation(true);
        const result = await createConversation(userId, [messageToSend]);
        setIsLoadingConversation(false);
        if (result?.id) {
            conversationIdToUse = result.id;
            setInternalConversationId(result.id);
        } else {
            toast.error("Failed to create conversation.");
            return;
        }
    }

    // Send message
    append(messageToSend, {
        body: { conversationId: conversationIdToUse },
    });
  };

  // --- Handle Prompt Click --- 
  const handlePromptClick = (prompt: string) => {
    handleCustomSubmit({ prompt }); // Trigger submit with prompt
  };

  // --- Effect for scrolling --- (Keep as before, using scrollAreaRef)
  useEffect(() => { /* ... scrolling logic ... */ }, [messages]);

  // --- Welcome Screen Logic --- 
  const showWelcome = messages.length === 0 && !isLoadingConversation && !internalConversationId;
  const isOutOfMessages = remainingCount === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversation ? (
          <div className="flex items-center justify-center h-full">Loading...</div>
        ) : showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Card className="w-full max-w-2xl mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">Welcome to Supachat! ⚡</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">I'm an AI assistant specialized in answering questions about Supabase and PostgreSQL.</p>
                {isOutOfMessages ? (
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-2">Daily Message Limit Reached</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      You've used all your messages for today. {!user && "Sign up to get more messages!"}
                    </p>
                    {!user && (
                      <Button asChild className="w-full mt-2">
                        <Link to="/register">Sign Up for More Messages</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    You have {remainingCount} messages remaining today.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {promptSuggestions.map((suggestion, index) => (
                <Card 
                  key={index} 
                  className={cn(
                    "cursor-pointer hover:bg-accent transition-colors hover:cursor-pointer",
                    isOutOfMessages && "opacity-50 cursor-not-allowed hover:bg-background"
                  )}
                  onClick={() => !isOutOfMessages && handlePromptClick(suggestion.prompt)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      !isOutOfMessages && handlePromptClick(suggestion.prompt);
                    }
                  }}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {/* Map over useChat's messages */}
            {messages.map((m) => (
              <div key={m.id} className={cn("flex items-start gap-3 mb-4", m.role === 'user' ? "justify-end" : "")}>
                {m.role === 'assistant' && (
                  <Avatar className="h-8 w-8 border"><AvatarFallback>AI</AvatarFallback></Avatar>
                )}
                <div className={cn("max-w-[70%] rounded-lg p-3 text-sm shadow-sm break-words", m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <Avatar className="h-8 w-8 border"><AvatarFallback>U</AvatarFallback></Avatar>
                )}
              </div>
            ))}
             {/* useChat hook provides isLoading state */}
            {isLoadingAiResponse && (
                 <div className="flex items-start gap-3"> 
                    {/* ... AI loading indicator JSX ... */} 
                 </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Input Area */} 
      <div className="border-t p-4 bg-background">
        {/* Use useChat's handleSubmit for the form */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <Textarea
            placeholder={remainingCount === 0 ? "Daily message limit reached." : "Type your message here..."}
            value={input} // Controlled by useChat
            onChange={handleInputChange} // Provided by useChat
            rows={1}
            className="flex-1 resize-none min-h-[40px] max-h-[150px] overflow-y-auto"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCustomSubmit(); // Call custom submit
              }
            }}
            disabled={isLoadingAiResponse || isLoadingConversation || remainingCount === 0}
          />
          <Button type="submit" size="icon" disabled={isLoadingAiResponse || isLoadingConversation || !input.trim() || remainingCount === 0}>
            <SendHorizonal className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
           {remainingCount !== null ? `${remainingCount} messages remaining today.` : (user ? 'Loading usage...' : '')}
        </p>
      </div>
    </div>
  );
}; 