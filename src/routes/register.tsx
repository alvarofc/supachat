import React, { useState, useRef, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";

export const Route = createFileRoute('/register')({
  component: RegisterComponent,
});

function RegisterComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Turnstile script with nonce
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.nonce = 'OYelkSsSqFHJEUYs'; // Match your CSP nonce
    
    script.onload = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        window.turnstile.render(turnstileContainerRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
          callback: (token: string) => {
            setToken(token);
          },
          'error-callback': () => {
            setToken(null);
            toast.error("CAPTCHA verification failed");
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
      if (window.turnstile) {
        window.turnstile.remove();
      }
    };
  }, []);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error("Please complete the CAPTCHA");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: token
        }
      });
      if (error) throw error;
      toast.info("Registration Submitted", {
        description: "Please check your email to confirm your account.",
      });
      // Consider navigating to a page informing the user to check their email
      // or navigate('/login') after a short delay if email verification is off
      // navigate({ to: '/login' });
    } catch (err: any) {
      console.error("Registration Error:", err);
      toast.error("Registration Failed", {
        description: err.message || "An unexpected error occurred.",
      });
      // Reset Turnstile on error
      turnstileRef.current?.reset();
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your email and password to register</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex justify-center">
              <div ref={turnstileContainerRef}></div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 