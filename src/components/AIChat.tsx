import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea, ScrollArea } from '@/components/ui/components';
import { Bot, Send, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  'Best performing campaign?',
  'Show hot leads',
  'How to reduce CPL?',
  'Daily summary',
];

const aiResponses: Record<string, string> = {
  'best': 'Berkeley Syon Lane is your top performing campaign with £18 CPL, generating 235 leads this month. It\'s 48% below your target CPL of £35. Key success factors: precise audience targeting and high-quality creative assets.',
  'hot': 'You have 465 hot leads requiring immediate attention. Top 3:\n\n• James Chen (Q:92, I:88) - £800k-1M budget, ready within 28 days\n• Sarah Williams (Q:85, I:91) - Viewing booked at Berkeley Syon Lane\n• Mohammed Al-Rashid (Q:95, I:78) - Cash buyer interested in multiple units',
  'cpl': 'To reduce CPL, I recommend:\n\n1. Pause Tudor Financial (£156 CPL) - save £2,400/month\n2. Shift 20% budget to Berkeley campaigns (£18 CPL)\n3. Focus on lookalike audiences from converted leads\n4. A/B test creative variations on underperforming ads',
  'summary': 'Today\'s Summary:\n\n• 23 new leads acquired (5 hot)\n• £1,234 spent across 6 active campaigns\n• Average CPL: £54 (target: £35)\n\nAction items:\n- 3 hot leads need callbacks\n- 1 campaign needs attention (Tudor Financial)\n- 2 viewing confirmations pending',
  'default': 'I can help you analyze your lead data, campaign performance, and provide actionable recommendations. Try asking about your best campaigns, hot leads, or ways to reduce CPL.',
};

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('best') || lowerQuery.includes('performing')) return aiResponses['best'];
    if (lowerQuery.includes('hot') || lowerQuery.includes('priority')) return aiResponses['hot'];
    if (lowerQuery.includes('cpl') || lowerQuery.includes('reduce') || lowerQuery.includes('cost')) return aiResponses['cpl'];
    if (lowerQuery.includes('summary') || lowerQuery.includes('today') || lowerQuery.includes('daily')) return aiResponses['summary'];
    return aiResponses['default'];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = getAIResponse(userMessage);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed z-50 shadow-2xl transition-all ${
      isMinimized 
        ? 'bottom-6 right-6 w-72 h-14' 
        : 'bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-96 h-[85vh] md:h-[500px] md:rounded-lg rounded-t-lg'
    }`}>
      <CardHeader className="pb-2 border-b flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI Assistant
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <ScrollArea className="flex-1 p-4 h-[calc(85vh-120px)] md:h-[360px]" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Ask me anything about your data
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs justify-start"
                      onClick={() => setInput(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <CardContent className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[40px] max-h-[60px] resize-none text-sm"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
