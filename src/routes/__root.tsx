import React, { useEffect, useState } from 'react';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
// import { AuthStatus } from '../components/AuthStatus' // Removed AuthStatus import
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Sidebar } from '@/components/Sidebar'; // Import Sidebar

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  // const { loading } = useAuth() // Removed loading state

  // --- State for Active Chat --- 
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleSelectConversation = (id: string | null) => {
      setActiveConversationId(id);
      // Optionally navigate to '/' when a conversation or new chat is selected
      // This requires injecting the router instance or using useNavigate()
      // navigate({ to: '/' }); 
  };
  // --- End State Management --- 

  // Set header height CSS variable
  useEffect(() => {
    const header = document.getElementById('app-header');
    if (header) {
      const headerHeight = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
      // Optional: Add resize listener if header height can change dynamically
      // const resizeObserver = new ResizeObserver(entries => {
      //   for (let entry of entries) {
      //     document.documentElement.style.setProperty('--header-height', `${entry.contentRect.height}px`);
      //   }
      // });
      // resizeObserver.observe(header);
      // return () => resizeObserver.disconnect();
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Optional: Show a loading indicator while auth state is initializing
  // if (loading) {
  //   return <div>Initializing Auth...</div>;
  // }

  return (
    <>
      <div id="app-header" className="p-2 flex gap-2 items-center border-b">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-semibold text-lg">Supachat</span>
        </Link>
      </div>
      <hr />
      {/* Main Content Area with Sidebar */}
      <div className="flex h-[calc(100vh-var(--header-height))] bg-background">
          {/* Sidebar */} 
          <div className="w-64 border-r hidden md:block flex-shrink-0"> {/* Added flex-shrink-0 */}
            <Sidebar 
              onSelectConversation={handleSelectConversation} 
              activeConversationId={activeConversationId}
            />
          </div>
          {/* Page Content Rendered Here */} 
          <div className="flex-1 flex flex-col overflow-y-auto"> {/* Added overflow */}
             <Outlet /> 
          </div>
      </div>
      <SonnerToaster richColors position="top-right" />
      {/* Devtools optional */}
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}