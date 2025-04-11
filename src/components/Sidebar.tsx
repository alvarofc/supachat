import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus, Loader2, HelpCircle, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useRouterState } from '@tanstack/react-router';
import { getRemainingMessages } from '../lib/messageLimiter';
import { listConversations } from '../lib/chatApi';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "../lib/supabaseClient";

interface ConversationStub {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  onSelectConversation: (id: string | null) => void;
  activeConversationId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectConversation, activeConversationId }) => {
  const { user } = useAuth();
  const { location } = useRouterState();
  const pathname = location.pathname;

  const [conversations, setConversations] = useState<ConversationStub[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoadingConversations(true);
      listConversations(user.id)
        .then(setConversations)
        .finally(() => setIsLoadingConversations(false));
    }
  }, [user]);

  const remainingMessages = getRemainingMessages(user?.id || null);

  const isChatActive = pathname === '/';

  return (
    <div className="flex flex-col h-full p-2 bg-muted/40 border-r">
      <Button
          variant={isChatActive && !activeConversationId ? "secondary" : "ghost"}
          className="mb-1 w-full justify-start"
          asChild
        >
      <Link to="/" className="block">
        
          <PlusCircle className="mr-2 h-4 w-4" /> New Chat
        
      </Link>
      </Button>
      <Button variant={pathname === '/welcome' ? "secondary" : "ghost"} className="w-full justify-start mb-1" asChild>
      <Link to="/welcome" className="block">
   
          <Home className="mr-2 h-4 w-4" /> Welcome
        
      </Link>
      </Button>
      <Button variant={pathname === '/faq' ? "secondary" : "ghost"} className="w-full justify-start mb-1" asChild>
      <Link to="/faq" className="block">
        <HelpCircle className="mr-2 h-4 w-4" /> FAQ
      
      </Link>
      </Button>
      <h2 className="text-xs font-semibold mt-4 mb-1 px-2 text-muted-foreground uppercase">History</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-0">
          {isLoadingConversations ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin h-5 w-5" />
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((chat) => (
              <Button
                key={chat.id}
                variant={isChatActive && activeConversationId === chat.id ? "secondary" : "ghost"}
                className="w-full justify-start truncate h-8 text-sm font-normal"
                onClick={() => onSelectConversation(chat.id)}
              >
                {chat.title || new Date(chat.updated_at).toLocaleString() || 'Untitled Chat'}
              </Button>
            ))
          ) : (
            user && <p className="text-xs text-muted-foreground px-2 py-2">No chat history yet.</p>
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto pt-2 border-t">
        {!user && (
          <div className="p-2 space-y-2">
            <p className="text-xs text-center text-muted-foreground">
              {remainingMessages} messages left today.
            </p>
            <Button asChild className="w-full" size="sm">
              <Link to="/register">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </Link>
            </Button>
          </div>
        )}
        {user && (
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {remainingMessages} messages left
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => supabase.auth.signOut()}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
