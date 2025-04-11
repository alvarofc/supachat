import { createFileRoute } from '@tanstack/react-router'
import { ChatArea } from '@/components/ChatArea'

export const Route = createFileRoute('/')({
  component: Index,
  // Optionally, if conversation ID was part of the route path (e.g., /chat/$convoId):
  // loader: ({ params }) => { /* Load based on params.convoId */ }, 
})

function Index() {
  // State is now managed in __root.tsx
  // The ChatArea component receives the correct conversationId via props
  // passed down from the Outlet context implicitly or explicitly.
  // For this setup, the key prop in __root.tsx ensures ChatArea remounts
  // when the activeConversationId changes there.
  
  // We don't need to pass conversationId explicitly here IF ChatArea uses its prop correctly.
  // If ChatArea wasn't updated to use the prop from __root.tsx, we might need context.
  // But since ChatArea *does* accept the prop, this minimal component is fine.
  return <ChatArea conversationId={null} />; 
  // Passing null might be okay if ChatArea's useEffect handles the prop change correctly.
  // A cleaner way might be for __root.tsx to provide the ID via context.
}

// Helper to set header height CSS variable (adjust selector if needed)
// This should ideally run once, maybe in __root.tsx or main.tsx