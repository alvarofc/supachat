import React, { useState, useRef, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";

export const Route = createFileRoute('/login')({
  component: LoginComponent,
});

function LoginComponent() {
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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error("Please complete the CAPTCHA");
      return;
    }
    setLoading(true);
    try {
      console.log('Attempting login with token:', token); // Debug log
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: token
        }
      });
      if (error) throw error;
      toast.success("Login Successful", {
        description: "Redirecting...",
      });
      navigate({ to: '/' });
    } catch (err: any) {
      console.error("Login Error:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        name: err.name,
        details: err.details
      });
      toast.error("Login Failed", {
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
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
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
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 