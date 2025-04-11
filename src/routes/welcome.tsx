import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute('/welcome')({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Supachat! ⚡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            I'm your specialized AI assistant, ready to answer your questions about Supabase and PostgreSQL.
          </p>
          <p>
            Think of me as your go-to resource for:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Database schemas & SQL</li>
            <li>Row Level Security (RLS)</li>
            <li>Authentication & Authorization</li>
            <li>Storage Solutions</li>
            <li>Realtime Features</li>
            <li>Edge Functions</li>
            <li>Best practices and troubleshooting</li>
          </ul>
           <p>
            You can start a new chat from the sidebar or explore the FAQs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 