import { useState, useRef } from 'react';
import { MessageCircle, Trash2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/services/api';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClear = () => {
    setMessages([]);
    toast({ title: 'Chat cleared' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        title="AI Coach"
        subtitle="Ask anything about fitness"
      />

      {/* Clear Button */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Start a conversation</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              Ask me about workouts, nutrition, recovery, or anything fitness related!
            </p>
            <div className="grid gap-2 mt-6 w-full max-w-[280px]">
              {[
                'How should I warm up before lifting?',
                'What should I eat after a workout?',
                'How do I improve my running pace?',
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3 justify-start text-left"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <Card
                  className={cn(
                    'max-w-[85%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card'
                  )}
                >
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {new Date(message.timestamp).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </CardContent>
                </Card>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Placeholder for future chat input */}
      <div className="p-4 border-t border-border glass text-center text-sm text-muted-foreground">
        Chat functionality requires backend implementation
      </div>
    </div>
  );
}
