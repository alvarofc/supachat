import { generateId } from 'ai';
import type { Message } from '@ai-sdk/react';

// Helper to create messages easily
const createMsg = (role: 'user' | 'assistant', content: string): Message => ({
  id: generateId(),
  role,
  content,
  createdAt: new Date(),
});

// --- Welcome Conversation ---
export const welcomeMessages: Message[] = [
  { id: generateId(), role: 'assistant', content: 'Welcome to Supachat! ⚡', createdAt: new Date(Date.now() - 2000) },
  { id: generateId(), role: 'assistant', content: "I'm your specialized AI assistant, ready to answer your questions about Supabase and PostgreSQL.", createdAt: new Date(Date.now() - 1500) },
  { id: generateId(), role: 'assistant', content: 'Think of me as your go-to resource for:', createdAt: new Date(Date.now() - 1000) },
  { id: generateId(), role: 'assistant', content: '- Database schemas & SQL\n- Row Level Security (RLS)\n- Authentication & Authorization\n- Storage Solutions\n- Realtime Features\n- Edge Functions\n- Best practices and troubleshooting', createdAt: new Date(Date.now() - 500) },
  createMsg('assistant', 'Welcome to Supachat! ⚡'),
  createMsg('assistant', "I'm your specialized AI assistant, ready to answer your questions about Supabase and PostgreSQL."),
  createMsg('assistant', 'Think of me as your go-to resource for:'),
  createMsg('assistant', '- Database schemas & SQL\n- Row Level Security (RLS)\n- Authentication & Authorization\n- Storage Solutions\n- Realtime Features\n- Edge Functions\n- Best practices and troubleshooting'),
  createMsg('assistant', 'You can start a new chat from the sidebar or explore the FAQs.'),
];

// --- FAQ Conversation ---
export const faqMessages: Message[] = [
  createMsg('assistant', 'Frequently Asked Questions 🤔'),
  createMsg('user', 'How does the message limit work?'),
  createMsg('assistant', 'Anonymous users get 2 free messages per day. Signed-up users get 10 messages per day (tracked via your profile).'),
  createMsg('user', 'Is my conversation history saved?'),
  createMsg('assistant', 'For logged-in users, yes! Your conversations are securely stored in your Supabase project. Anonymous chats are not saved.'),
  createMsg('user', 'What AI model are you using?'),
  createMsg('assistant', "I'm currently running on OpenAI's gpt-4o-mini model, optimized for helpfulness and knowledge about Supabase and Postgres."),
  createMsg('user', 'Can you help me write SQL queries?'),
  createMsg('assistant', "Absolutely! Just describe what you need the query to do, and I'll do my best to help you write it for PostgreSQL."),
]; 