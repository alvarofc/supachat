import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


export const Route = createFileRoute('/faq')({
  component: FaqPage,
});

const faqItems = [
    {
        question: "How does the message limit work?",
        answer: "Anonymous users get 2 free messages per day. Signed-up users get 10 messages per day (tracked via your profile)."
    },
    {
        question: "Is my conversation history saved?",
        answer: "For logged-in users, yes! Your conversations are securely stored in your Supabase project. Anonymous chats are not saved."
    },
    {
        question: "What AI model are you using?",
        answer: "I'm currently running on OpenAI's gpt-4o-mini model, optimized for helpfulness and knowledge about Supabase and Postgres."
    },
    {
        question: "Can you help me write SQL queries?",
        answer: "Absolutely! Just describe what you need the query to do, and I'll do my best to help you write it for PostgreSQL."
    },
];

function FaqPage() {
  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Frequently Asked Questions 🤔</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                 {faqItems.map((item, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>
                        {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
} 