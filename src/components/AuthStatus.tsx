import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, UserPlus, User as UserIcon } from 'lucide-react'; // Icons

export const AuthStatus: React.FC = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    // You might want a Skeleton loader here from Shadcn eventually
    return <div className="h-10 w-20 animate-pulse bg-muted rounded-md"></div>;
  }

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';
  // You might get a user avatar URL from Supabase user_metadata later
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user.email || 'User'} />}
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.email || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {/* You could show user role or other info here */}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Add links to profile/settings if needed */}
            {/* <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={signOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/login">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Link>
          </Button>
          <Button asChild>
            <Link to="/register">
               <UserPlus className="mr-2 h-4 w-4" /> Register
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}; 